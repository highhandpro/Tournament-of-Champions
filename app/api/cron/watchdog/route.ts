/**
 * POST /api/cron/watchdog
 *
 * Called by the GitHub Actions watchdog workflow (~noon Pacific, 6 hours
 * after the main cron window closes).
 *
 * Logic:
 *   1. Check EmailLog — did a successful cron run already happen today?
 *   2. Check Event collection — are there any emails that were scheduled
 *      for today but still have their *Sent flag unset?
 *   3. If missed emails exist → re-run the email cron (idempotent) and
 *      send an alert to all ADMIN users.
 *
 * Auth: CRON_SECRET bearer token (same secret as the main cron).
 */

import connectToDatabase from "@/lib/mongodb";
import EmailLog from "@/models/EmailLog";
import Event from "@/models/Event";
import { runScheduledEventEmailsAt9amPst, getPstDayRangeUtc } from "@/lib/scheduledEventEmailUtils";
import { sendAdminCronAlertEmail, type CronMissDetail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Auth — same CRON_SECRET as the main cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { startUtc, endUtc } = getPstDayRangeUtc(new Date());

  // ── 1. Did the main cron already run successfully today? ──────────────────
  const existingRun = await EmailLog.findOne({
    runAt: { $gte: startUtc, $lte: endUtc },
    success: true,
  }).lean();

  // ── 2. Are there any emails that should have gone out today but didn't? ───
  const missedEvents = await Event.find({
    status: "ACTIVE",
    $or: [
      { announcementTier1At: { $gte: startUtc, $lte: endUtc }, announcementTier1Sent: { $ne: true } },
      { announcementTier2At: { $gte: startUtc, $lte: endUtc }, announcementTier2Sent: { $ne: true } },
      { announcementPostAt:  { $gte: startUtc, $lte: endUtc }, announcementPostSent:  { $ne: true } },
      { reminderAt:          { $gte: startUtc, $lte: endUtc }, reminderSent:          { $ne: true } },
    ],
  }).select("title announcementTier1At announcementTier1Sent announcementTier2At announcementTier2Sent announcementPostAt announcementPostSent reminderAt reminderSent").lean();

  const hasMissed = missedEvents.length > 0;

  if (!hasMissed) {
    // Everything was sent — nothing to do.
    return NextResponse.json({
      status: "ok",
      message: existingRun
        ? "Main cron ran successfully today — no missed emails."
        : "No emails were scheduled for today.",
      mainCronRan: !!existingRun,
      missedEmailsFound: false,
    });
  }

  // ── 3. Missed emails found — re-run the cron ─────────────────────────────
  let rerunResult: Awaited<ReturnType<typeof runScheduledEventEmailsAt9amPst>> | null = null;
  let rerunError: string | undefined;

  try {
    rerunResult = await runScheduledEventEmailsAt9amPst();
  } catch (err) {
    rerunError = err instanceof Error ? err.message : String(err);
    console.error("[watchdog] re-run failed:", rerunError);
  }

  // Persist watchdog run to EmailLog
  try {
    await EmailLog.create({
      runAt: new Date(),
      triggeredBy: "watchdog-cron",
      eventsProcessed: rerunResult?.eventsProcessed ?? 0,
      emailsSent: rerunResult?.emailsSent ?? 0,
      details: rerunResult?.details ?? [],
      error: rerunError,
      success: !rerunError,
    });
  } catch (logErr) {
    console.error("[watchdog] failed to write EmailLog:", logErr);
  }

  // ── 4. Alert all admins ───────────────────────────────────────────────────
  const missedDetails: CronMissDetail[] = missedEvents.map((ev: any) => {
    const types: string[] = [];
    if (ev.announcementTier1At && !ev.announcementTier1Sent) types.push("Tier 1 Announcement");
    if (ev.announcementTier2At && !ev.announcementTier2Sent) types.push("Tier 2 Announcement");
    if (ev.announcementPostAt  && !ev.announcementPostSent)  types.push("General Announcement");
    if (ev.reminderAt          && !ev.reminderSent)          types.push("Reminder");
    return { eventTitle: ev.title, missedTypes: types };
  });

  try {
    await sendAdminCronAlertEmail(missedDetails, "watchdog");
  } catch (alertErr) {
    console.error("[watchdog] failed to send admin alert:", alertErr);
  }

  return NextResponse.json({
    status: rerunError ? "rerun_failed" : "rerun_ok",
    message: rerunError
      ? `Missed emails detected; re-run attempted but failed: ${rerunError}`
      : `Missed emails detected; re-run sent ${rerunResult?.emailsSent ?? 0} email(s). Admin alert dispatched.`,
    mainCronRan: !!existingRun,
    missedEmailsFound: true,
    rerunEmailsSent: rerunResult?.emailsSent ?? 0,
    rerunEventsProcessed: rerunResult?.eventsProcessed ?? 0,
    adminAlertSent: true,
    missedDetails,
  });
}
