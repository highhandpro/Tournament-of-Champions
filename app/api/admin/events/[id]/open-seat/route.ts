import { getOpenSeatEmail, sendEmail } from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import "@/models/Host";
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const event = await Event
      .findById(id)
      .populate('registeredPlayers', '_id')
      .populate('invitedPlayers', '_id')
      .populate('waitlist', '_id');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot send open-seat notification for an archived event' },
        { status: 400 }
      );
    }

    const seatsAvailable = Math.max(
      0,
      (event.maxPlayers ?? 0) - event.registeredPlayers.length
    );

    if (seatsAvailable === 0) {
      return NextResponse.json(
        { error: 'Event has no seats available — notification not sent.' },
        { status: 400 }
      );
    }

    // Target: approved members who are NOT already registered.
    // This intentionally INCLUDES waitlisted players so they also hear about it.
    const registeredIds = event.registeredPlayers.map((p: any) => p._id ?? p);

    const recipients = await User.find({
      approvalStatus: 'APPROVED',
      _id: { $nin: registeredIds },
    }).select('firstName email');

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients found (all approved members are already registered).' },
        { status: 400 }
      );
    }

    console.log(
      `Sending open-seat notification to ${recipients.length} members for event: ${event.title}`
    );

    const emailPromises = recipients.map(async (user: any) => {
      try {
        const emailData = getOpenSeatEmail(
          user.firstName,
          user.email,
          event.title,
          event.dateTime,
          event.location,
          event.buyInMin,
          event.buyInMax,
          event._id.toString(),
          seatsAvailable,
          event.maxPlayers
        );
        const success = await sendEmail(emailData);
        if (success) {
          console.log(`Open-seat notification sent to ${user.email}`);
          return 1;
        } else {
          console.error(`Failed to send open-seat notification to ${user.email}`);
          return 0;
        }
      } catch (err) {
        console.error(`Error sending open-seat notification to ${user.email}:`, err);
        return 0;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const emailsSent = results.reduce((count, result) => {
      return result.status === 'fulfilled' ? count + result.value : count;
    }, 0);

    console.log(`Sent ${emailsSent} open-seat notifications for event: ${event.title}`);

    return NextResponse.json({
      message: 'Open-seat notifications sent successfully',
      eventId: event._id.toString(),
      eventTitle: event.title,
      emailsSent,
      totalRecipients: recipients.length,
    });

  } catch (error) {
    console.error('Open-seat notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
