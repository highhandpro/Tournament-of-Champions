import { runScheduledEventEmailsAt9amPst } from "@/lib/scheduledEventEmailUtils";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isVercelCron) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (!token || !token.email) {
        return NextResponse.json({ error: "No valid session found" }, { status: 401 });
      }

      if (!token.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    const result = await runScheduledEventEmailsAt9amPst();

    return NextResponse.json({
      message: "Scheduled event emails executed",
      eventsProcessed: result.eventsProcessed,
      emailsSent: result.emailsSent,
    });
  } catch (error) {
    console.error("run-scheduled-event-emails error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}