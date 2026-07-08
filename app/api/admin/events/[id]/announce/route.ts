import { getEventAnnouncementEmail, sendEmail } from '@/lib/email';
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

    // Check if user is admin
    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    
    await connectToDatabase();

    const event = await Event
      .findById(id)
      .populate({
        path: 'host',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      })
      .populate('registeredPlayers', '_id')
      .populate('invitedPlayers', '_id')
      .populate('waitlist', '_id');

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if announcement was already sent
    if (event.announcementSent) {
      return NextResponse.json(
        { error: 'Event announcement already sent' },
        { status: 400 }
      );
    }

    // Don't announce an event that has no seats available — players complained
    // about receiving announcements for full events. A non-positive maxPlayers
    // is treated as no seats, and registeredPlayers >= maxPlayers means full.
    const seatsAvailable = Math.max(
      0,
      (event.maxPlayers ?? 0) - event.registeredPlayers.length
    );
    if (seatsAvailable === 0) {
      return NextResponse.json(
        {
          error:
            'Event has no seats available — announcement not sent. Increase max players or free up seats before announcing.',
        },
        { status: 400 }
      );
    }

    // Get all approved users who have had NO prior contact with this event:
    // excludes registered players, invited players, and waitlisted players
    const excludedIds = [
      ...event.registeredPlayers.map((p: any) => p._id ?? p),
      ...event.invitedPlayers.map((p: any) => p._id ?? p),
      ...event.waitlist.map((p: any) => p._id ?? p),
    ];
    const approvedUsers = await User.find({
      approvalStatus: 'APPROVED',
      _id: { $nin: excludedIds }
    }).select('firstName email');

    if (approvedUsers.length === 0) {
      return NextResponse.json(
        { error: 'No approved users found who are not already registered for this event' },
        { status: 400 }
      );
    }

    console.log(`Sending event announcement to ${approvedUsers.length} approved users for event: ${event.title}`);

    // Send announcement emails to all approved users
    const emailPromises = approvedUsers.map(async (user: any) => {
      try {
        const emailData = getEventAnnouncementEmail(
          user.firstName,
          user.email,
          event.title,
          event.dateTime,
          event.location,
          event.buyInMin,
          event.buyInMax,
          event._id.toString(),
          event.host,
          event.blinds,
          [event.details, event.details1, event.details2, event.details3].filter(Boolean).join('<br>'),
          seatsAvailable,
          event.maxPlayers
        );
        
        const success = await sendEmail(emailData);
        if (success) {
          console.log(`Event announcement sent to ${user.email} for event ${event.title}`);
          return 1;
        } else {
          console.error(`Failed to send announcement to ${user.email} for event ${event.title}`);
          return 0;
        }
      } catch (error) {
        console.error(`Error sending announcement to ${user.email}:`, error);
        return 0;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const emailsSent = results.reduce((count, result) => {
      if (result.status === 'fulfilled') {
        return count + result.value;
      }
      return count;
    }, 0);

    event.announcementSent = true;
    await event.save();

    console.log(`Sent ${emailsSent} announcement emails for event: ${event.title}`);

    return NextResponse.json({
      message: 'Event announcement sent successfully',
      eventId: event._id.toString(),
      eventTitle: event.title,
      emailsSent,
      totalUsers: approvedUsers.length
    });

  } catch (error) {
    console.error('Event announcement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}