import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import Host from "@/models/Host";
import User from "@/models/User";
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const section = searchParams.get("section"); // "events" or "upcoming"
    const limitParam = searchParams.get("limit");


    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Private events visibility logic
    let currentUser = null;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (token?.email) {
      currentUser = await User.findOne({ email: token.email.toLowerCase() });
    }

    const isUserAdmin = currentUser?.role === 'ADMIN';

    if (!isUserAdmin) {
      const visibilityOrConditions: any[] = [
        { isPrivate: { $ne: true } }
      ];

      if (currentUser) {
        visibilityOrConditions.push(
          { registeredPlayers: currentUser._id },
          { waitlist: currentUser._id }
        );
      }

      query.$and = query.$and || [];
      query.$and.push({ $or: visibilityOrConditions });
    }

    const now = new Date();

    if (section === "events") {
      // Events section: announcementTier1At has passed or is not set
      query.$or = [
        { announcementTier1At: { $exists: false } },
        { announcementTier1At: null },
        { announcementTier1At: { $lte: now } }
      ];
    } else if (section === "upcoming") {
      // Upcoming section: announcementTier1At is in the future
      query.announcementTier1At = { $gt: now };
    }


    let eventsQuery = Event.find(query)
      .populate("registeredPlayers", "firstName lastName")
      .populate("invitedPlayers", "firstName lastName")
      .populate("waitlist", "firstName lastName")
      .populate({
        path: "host",
        populate: { path: "user", select: "firstName lastName email" }
      })
      .sort({ dateTime: 1 });


    if (limitParam) {
      const limit = Number(limitParam);

      if (!isNaN(limit) && limit > 0) {
        eventsQuery = eventsQuery.limit(limit);
      } else {
        console.log("⚠️ Invalid limit ignored");
      }
    }

    const events = await eventsQuery.exec();

    const cutoff = new Date(now.getTime() - 90 * 60 * 1000);

    const eventsToArchive = events.filter((event: any) => {
      if (!event.dateTime) {
        return false;
      }

      const eventDate = new Date(event.dateTime);
      return event.status === "ACTIVE" && eventDate < cutoff;
    });


    if (eventsToArchive.length > 0) {
      await Event.updateMany(
        { _id: { $in: eventsToArchive.map((e: any) => e._id) } },
        { status: "ARCHIVED" }
      );
    }

    const finalEvents =
      status === "ACTIVE"
        ? events.filter((event: any) => {
            const eventDate = new Date(event.dateTime);
            return event.status === "ACTIVE" && eventDate >= cutoff;
          })
        : events;

    // Convert to objects with virtual fields included
    const eventsWithVirtuals = finalEvents.map(event => {
      const eventObj = event.toObject({ virtuals: true });
      return {
        ...eventObj,
        dateTime: event.dateTime.toISOString(),
        details1: eventObj.details1 || null,
        details2: eventObj.details2 || null,
        details3: eventObj.details3 || null,
      };
    });

    return NextResponse.json({
      events: eventsWithVirtuals,
      count: eventsWithVirtuals.length,
    });

  } catch (error) {
    console.log("ERROR : ", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
