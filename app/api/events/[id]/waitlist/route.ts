import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import { logRegistrationAction } from '@/lib/registrationTracking';
import Event from '@/models/Event';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Please log in to view waitlist' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id).populate('waitlist', 'firstName lastName email');
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      waitlist: event.waitlist,
      waitlistCount: event.waitlist.length
    });

  } catch (error) {
    console.error('Get waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Please log in to join waitlist' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Get user from email (NextAuth way)
    const user = await User.findOne({ email: token.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();

    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot join waitlist for archived events' },
        { status: 400 }
      );
    }

    if (event.isPrivate) {
      const isInvited = event.invitedPlayers.some(
        (playerId: any) => playerId.toString() === userId
      );
      if (!isInvited) {
        return NextResponse.json(
          { error: 'This event is private and by invitation only' },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    if (event.dateTime < now) {
      return NextResponse.json(
        { error: 'Cannot join waitlist for events that have already started' },
        { status: 400 }
      );
    }

    // Check if already registered
    const isAlreadyRegistered = event.registeredPlayers.some(
      (playerId: any) => playerId.toString() === userId
    );

    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    // Check if already in waitlist
    const isInWaitlist = event.waitlist.some(
      (playerId: any) => playerId.toString() === userId
    );

    if (isInWaitlist) {
      return NextResponse.json(
        { error: 'You are already on the waitlist for this event' },
        { status: 400 }
      );
    }

    // Check if event has space (if it does, register them directly)
    if (event.registeredPlayers.length < event.maxPlayers) {
      return NextResponse.json(
        { error: 'Event has available spots. Please register normally.' },
        { status: 400 }
      );
    }

    // Add to waitlist
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $addToSet: { waitlist: userId } },
      { new: true }
    ).populate('waitlist', 'firstName lastName email');

    await logRegistrationAction({
      event,
      user,
      action: 'WAITLISTED',
      actor: { email: token.email },
    });

    return NextResponse.json({
      event: updatedEvent,
      message: 'Successfully added to waitlist',
    });

  } catch (error) {
    console.error('Join waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Please log in to leave waitlist' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: token.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id.toString();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot leave waitlist for archived events' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (event.dateTime < now) {
      return NextResponse.json(
        { error: 'Cannot leave waitlist for events that have already started' },
        { status: 400 }
      );
    }

    const isInWaitlist = event.waitlist.some(
      (playerId: any) => playerId.toString() === userId
    );

    if (!isInWaitlist) {
      return NextResponse.json(
        { error: 'You are not on the waitlist for this event' },
        { status: 400 }
      );
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { waitlist: userId } },
      { new: true }
    ).populate('waitlist', 'firstName lastName email');

    await logRegistrationAction({
      event,
      user,
      action: 'WAITLIST_LEFT',
      actor: { email: token.email },
    });

    return NextResponse.json({
      event: updatedEvent,
      message: 'Successfully removed from waitlist',
    });

  } catch (error) {
    console.error('Leave waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
