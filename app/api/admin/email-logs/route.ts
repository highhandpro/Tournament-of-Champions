import connectToDatabase from "@/lib/mongodb";
import EmailLog from "@/models/EmailLog";
import Event from "@/models/Event";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 });
    }

    if (!token.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectToDatabase();

    const [logs, events] = await Promise.all([
      // 60 most recent runs (14 days × up to 3 runs/day: cron + watchdog + manual)
      EmailLog.find({}).sort({ runAt: -1 }).limit(60).lean(),

      // All active events with their email scheduling fields
      Event.find({ status: "ACTIVE" })
        .select(
          "title dateTime announcementTier1At announcementTier1Sent announcementTier2At announcementTier2Sent announcementPostAt announcementPostSent reminderAt reminderSent"
        )
        .sort({ dateTime: 1 })
        .lean(),
    ]);

    return NextResponse.json({ logs, events });
  } catch (error) {
    console.error("email-logs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
