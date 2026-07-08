import { getEventAnnouncementEmail, getEventReminderEmail, sendEmail } from "@/lib/email";
import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import "@/models/Host";
import Host from "@/models/Host";
import User from "@/models/User";

const toIds = (arr: any[]) =>
  (arr || []).map((x) => (typeof x === "string" ? x : x?._id)).filter(Boolean);

// Mirrors the guard in app/api/admin/events/[id]/announce/route.ts — players
// complained about receiving announcements for full events. A non-positive
// maxPlayers is treated as zero seats; registeredPlayers >= maxPlayers means
// the event is full.
function getSeatsAvailable(event: any): number {
  const max = event?.maxPlayers ?? 0;
  const registered = (event?.registeredPlayers || []).length;
  return Math.max(0, max - registered);
}

export function getPstDayRangeUtc(date = new Date()) {
  const tz = "America/Los_Angeles";

  const yyyyMmDd = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const [y, m, d] = yyyyMmDd.split("-").map(Number);

  const pstFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const tryOffsets = [8, 7];
  const makeCandidate = (offsetHours: number) => new Date(Date.UTC(y, m - 1, d, offsetHours, 0, 0));

  let start = makeCandidate(8);
  for (const off of tryOffsets) {
    const c = makeCandidate(off);
    const parts = pstFormatter.formatToParts(c);
    const hr = Number(parts.find((p) => p.type === "hour")?.value);
    const min = Number(parts.find((p) => p.type === "minute")?.value);
    if (hr === 0 && min === 0) {
      start = c;
      break;
    }
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);

  return { startUtc: start, endUtc: end };
}

interface SendResult {
  sent: number;
  subject: string;
  recipients: { name: string; email: string }[];
}

async function sendReminderToRegisteredUsers(users: any[], event: any): Promise<SendResult> {
  let sent = 0;
  const recipients: { name: string; email: string }[] = [];

  for (const u of users) {
    if (!u?.email) continue;

    const eventDetails = [event.details, event.details1, event.details2, event.details3].filter(Boolean).join('<br>');
    const emailData = getEventReminderEmail(
      u.firstName || "",
      u.email,
      event.title,
      event.dateTime,
      event.location,
      event.host,
      event.buyInMin,
      event.buyInMax,
      event.blinds,
      eventDetails,
      event._id.toString()
    );

    const ok = await sendEmail(emailData);
    if (ok) {
      sent += 1;
      recipients.push({ name: u.firstName || "", email: u.email });
    }
  }

  return { sent, subject: `Reminder: ${event.title}`, recipients };
}

async function sendAnnouncementToUsers(users: any[], event: any): Promise<SendResult> {
  let sent = 0;
  const recipients: { name: string; email: string }[] = [];

  const seatsAvailable = getSeatsAvailable(event);
  const maxPlayers = event?.maxPlayers ?? 0;

  for (const u of users) {
    if (!u?.email) continue;

    const eventDetails = [event.details, event.details1, event.details2, event.details3].filter(Boolean).join('<br>');
    const emailData = getEventAnnouncementEmail(
      u.firstName || "",
      u.email,
      event.title,
      event.dateTime,
      event.location,
      event.buyInMin,
      event.buyInMax,
      event._id.toString(),
      event.host,
      event.blinds,
      eventDetails,
      seatsAvailable,
      maxPlayers
    );

    const ok = await sendEmail(emailData);
    if (ok) {
      sent += 1;
      recipients.push({ name: u.firstName || "", email: u.email });
    }
  }

  return { sent, subject: `New Event Announcement: ${event.title}`, recipients };
}

export async function runScheduledEventEmailsAt9amPst(opts?: { eventIds?: string[] }) {
  await connectToDatabase();

  const { startUtc, endUtc } = getPstDayRangeUtc(new Date());

  const filter: any = {
    status: "ACTIVE",
    $or: [
      { announcementTier1At: { $gte: startUtc, $lte: endUtc }, announcementTier1Sent: { $ne: true } },
      { announcementTier2At: { $gte: startUtc, $lte: endUtc }, announcementTier2Sent: { $ne: true } },
      { announcementPostAt: { $gte: startUtc, $lte: endUtc }, announcementPostSent: { $ne: true } },
      { reminderAt: { $gte: startUtc, $lte: endUtc }, reminderSent: { $ne: true } },
    ],
  };

  // Test hook: when given a list of event IDs, scope the run to just those events.
  // The daily cron in production calls this with no opts and processes everything
  // due today (existing behavior).
  if (opts?.eventIds && opts.eventIds.length > 0) {
    filter._id = { $in: opts.eventIds };
  }

  const events = await Event.find(filter)
    .populate("registeredPlayers", "firstName lastName email approvalStatus")
    .populate({
      path: 'host',
      populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
    });

  let totalEmailsSent = 0;
  let eventsProcessed = 0;
  const details: { eventTitle: string; type: string; emailsSent: number; subject?: string; recipients?: { name: string; email: string }[] }[] = [];

  for (const event of events) {
    eventsProcessed += 1;

    const registeredIds = new Set(toIds(event.registeredPlayers));
    const seatsAvailable = getSeatsAvailable(event);

    let hostDoc: any = null;
    if (event.host) {
      const hostId = typeof event.host === "string" ? event.host : event.host?._id;
      if (hostId) {
        hostDoc = await Host.findById(hostId)
          .populate("tier1", "firstName lastName email approvalStatus")
          .populate("tier2", "firstName lastName email approvalStatus");
      }
    }

    if (
      event.announcementTier1At &&
      event.announcementTier1At >= startUtc &&
      event.announcementTier1At <= endUtc &&
      !event.announcementTier1Sent
    ) {
      if (event.doNotAnnounce) {
        details.push({ eventTitle: event.title, type: "Announcement (Tier 1) — SKIPPED: doNotAnnounce is set", emailsSent: 0 });
        event.announcementTier1Sent = true;
      } else
      if (seatsAvailable === 0) {
        // Skip — don't blast players for a full event. Leave the *Sent flag
        // unset so a host who raises maxPlayers later in the day can still
        // trigger the announcement manually via /api/admin/events/[id]/announce.
        details.push({ eventTitle: event.title, type: "Announcement (Tier 1) — SKIPPED: 0 seats available", emailsSent: 0 });
      } else {
        const tier1Users = (hostDoc?.tier1 || [])
          .filter((u: any) => u?.approvalStatus === "APPROVED")
          .filter((u: any) => !registeredIds.has(u?._id?.toString()));

        const result = await sendAnnouncementToUsers(tier1Users, event);
        totalEmailsSent += result.sent;
        details.push({ eventTitle: event.title, type: "Announcement (Tier 1)", emailsSent: result.sent, subject: result.subject, recipients: result.recipients });
        event.announcementTier1Sent = true;
      }
    }

    if (
      event.announcementTier2At &&
      event.announcementTier2At >= startUtc &&
      event.announcementTier2At <= endUtc &&
      !event.announcementTier2Sent
    ) {
      if (event.doNotAnnounce) {
        details.push({ eventTitle: event.title, type: "Announcement (Tier 2) — SKIPPED: doNotAnnounce is set", emailsSent: 0 });
        event.announcementTier2Sent = true;
      } else if (seatsAvailable === 0) {
        details.push({ eventTitle: event.title, type: "Announcement (Tier 2) — SKIPPED: 0 seats available", emailsSent: 0 });
      } else {
        const tier2Users = (hostDoc?.tier2 || [])
          .filter((u: any) => u?.approvalStatus === "APPROVED")
          .filter((u: any) => !registeredIds.has(u?._id?.toString()));

        const result = await sendAnnouncementToUsers(tier2Users, event);
        totalEmailsSent += result.sent;
        details.push({ eventTitle: event.title, type: "Announcement (Tier 2)", emailsSent: result.sent, subject: result.subject, recipients: result.recipients });
        event.announcementTier2Sent = true;
      }
    }

    if (
      event.announcementPostAt &&
      event.announcementPostAt >= startUtc &&
      event.announcementPostAt <= endUtc &&
      !event.announcementPostSent &&
      !event.announcementSent
    ) {
      if (event.doNotAnnounce) {
        details.push({ eventTitle: event.title, type: "Announcement (General) — SKIPPED: doNotAnnounce is set", emailsSent: 0 });
        event.announcementPostSent = true;
      } else if (seatsAvailable === 0) {
        details.push({ eventTitle: event.title, type: "Announcement (General) — SKIPPED: 0 seats available", emailsSent: 0 });
      } else {
        const tier1Ids = toIds(hostDoc?.tier1 || []);
        const tier2Ids = toIds(hostDoc?.tier2 || []);
        const excludedIds = Array.from(new Set([...tier1Ids, ...tier2Ids]));

        const approvedUsers = await User.find({
          approvalStatus: "APPROVED",
          _id: { $nin: excludedIds },
        }).select("firstName email");

        const result = await sendAnnouncementToUsers(approvedUsers, event);
        totalEmailsSent += result.sent;
        details.push({ eventTitle: event.title, type: "Announcement (General)", emailsSent: result.sent, subject: result.subject, recipients: result.recipients });
        event.announcementPostSent = true;
      }
    }

    if (
      event.reminderAt &&
      event.reminderAt >= startUtc &&
      event.reminderAt <= endUtc &&
      !event.reminderSent
    ) {
      const registeredUsers = (event.registeredPlayers || [])
        .filter((u: any) => u?.email);

      const result = await sendReminderToRegisteredUsers(registeredUsers, event);
      totalEmailsSent += result.sent;
      details.push({ eventTitle: event.title, type: "Reminder", emailsSent: result.sent, subject: result.subject, recipients: result.recipients });
      event.reminderSent = true;
    }

    await event.save();
  }

  return { success: true, eventsProcessed, emailsSent: totalEmailsSent, details };
}