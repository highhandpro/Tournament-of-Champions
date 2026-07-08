import { runScheduledEventEmailsAt9amPst } from "@/lib/scheduledEventEmailUtils";
import connectToDatabase from "@/lib/mongodb";
import EmailLog from "@/models/EmailLog";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const triggeredBy: "github-cron" | "in-app-manual-cron" = isVercelCron ? "github-cron" : "in-app-manual-cron";

  if (!isVercelCron) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 });
    }

    if (!token.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  let result: Awaited<ReturnType<typeof runScheduledEventEmailsAt9amPst>> | null = null;
  let errorMessage: string | undefined;

  try {
    result = await runScheduledEventEmailsAt9amPst();
  } catch (error) {
    console.error("run-scheduled-event-emails error:", error);
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  // Persist the run to the EmailLog collection regardless of success/failure
  try {
    await connectToDatabase();
    await EmailLog.create({
      runAt: new Date(),
      triggeredBy,
      eventsProcessed: result?.eventsProcessed ?? 0,
      emailsSent: result?.emailsSent ?? 0,
      details: result?.details ?? [],
      error: errorMessage,
      success: !errorMessage,
    });
  } catch (logError) {
    // Logging failure is non-fatal — report but don't change the response
    console.error("Failed to write EmailLog entry:", logError);
  }

  if (errorMessage) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    message: "Scheduled event emails executed",
    eventsProcessed: result!.eventsProcessed,
    emailsSent: result!.emailsSent,
    details: result!.details,
  });
}
