import { getEventRegistrationEmail, sendEmail } from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import { logRegistrationAction } from '@/lib/registrationTracking';
import Event from '@/models/Event';
import "@/models/Host";
import User from '@/models/User';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await context.params;

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid event or user ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find event and user
    const event = await Event.findById(id);
    const user = await User.findById(userId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isInWaitlist = event.waitlist.some((playerId: any) => playerId.toString() === userId);

    if (!isInWaitlist) {
      return NextResponse.json(
        { error: 'User is not in the waitlist' },
        { status: 400 }
      );
    }

    if (event.registeredPlayers.length >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      );
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        $pull: { waitlist: userId },
        $addToSet: { registeredPlayers: userId }
      },
      { new: true }
    ) .populate('registeredPlayers', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email')
      .populate({
        path: 'host',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      });

    await logRegistrationAction({
      event,
      user,
      action: 'ADMIN_PROMOTED_FROM_WAITLIST',
      actor: { email: token.email ?? undefined },
    });

    const eventDetails = [updatedEvent.details, updatedEvent.details1, updatedEvent.details2, updatedEvent.details3].filter(Boolean).join('<br>');
    sendEmail(
      getEventRegistrationEmail(
        user.firstName,
        user.email,
        updatedEvent.title,
        updatedEvent.dateTime,
        updatedEvent.location,
        updatedEvent.host,
        updatedEvent.buyInMin,
        updatedEvent.buyInMax,
        updatedEvent.blinds,
        eventDetails,
        updatedEvent._id.toString()
      )
    ).catch(console.error);

    return NextResponse.json({
      event: updatedEvent,
      message: 'Successfully moved user from waitlist to registered players'
    });

  } catch (error) {
    console.error('Move from waitlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email || !token.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid event or user ID' }, { status: 400 });
    }
    await connectToDatabase();
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { waitlist: userId } },
      { new: true }
    ).populate('registeredPlayers', 'firstName lastName email')
     .populate('waitlist', 'firstName lastName email');

    await logRegistrationAction({
      event,
      user,
      action: 'ADMIN_REMOVED_FROM_WAITLIST',
      actor: { email: token.email ?? undefined },
    });

    return NextResponse.json({
      event: updatedEvent,
      message: 'Successfully removed user from waitlist'
    });
  } catch (error) {
    console.error('Remove from waitlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
