import { getEarlyAccessRegistrationConfirmationEmail, sendEmail } from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import "@/models/Host";
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    let tokenData;
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      tokenData = JSON.parse(decoded);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    if (tokenData.exp < Date.now()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    if (tokenData.eventId !== id) {
      return NextResponse.json(
        { error: 'Token does not match event' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Event is not active' },
        { status: 400 }
      );
    }

    const user = await User.findById(tokenData.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = tokenData.userId;

    const isInvited = event.invitedPlayers.some(
      (p: any) => p.toString() === userId
    );
    if (!isInvited) {
      return NextResponse.json(
        { error: 'The invitation is invalid or you are not invited to this event' },
        { status: 400 }
      );
    }

    const isAlreadyRegistered = event.registeredPlayers.some(
      (p: any) => p.toString() === userId
    );
    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      );
    }

    const isInWaitlist = event.waitlist.some(
      (p: any) => p.toString() === userId
    );
    if (isInWaitlist) {
      return NextResponse.json(
        { error: 'You are already on the waitlist' },
        { status: 400 }
      );
    }

    // CRITICAL: Same logic as adding a player - check if event is full
    let updatedEvent;
    let message;

    if (event.registeredPlayers.length >= event.maxPlayers) {
      // Event is full - add to waitlist
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          $pull: { invitedPlayers: userId },
          $addToSet: { waitlist: userId }
        },
        { new: true }
      )
        .populate('registeredPlayers', 'firstName lastName email')
        .populate('invitedPlayers', 'firstName lastName email')
        .populate('waitlist', 'firstName lastName email');

      message = 'Event is full. You have been added to the waitlist.';
    } else {
      // Event has space - add to registered players
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          $pull: { invitedPlayers: userId },
          $addToSet: { registeredPlayers: userId }
        },
        { new: true }
      )
        .populate('registeredPlayers', 'firstName lastName email')
        .populate('invitedPlayers', 'firstName lastName email')
        .populate('waitlist', 'firstName lastName email')
        .populate({
          path: 'host',
          populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
        });

      const inviteEventDetails = [event.details, event.details1, event.details2, event.details3].filter(Boolean).join('<br>');
      sendEmail(
        getEarlyAccessRegistrationConfirmationEmail(
          user.firstName,
          user.email,
          updatedEvent.title,
          updatedEvent.dateTime,
          event.buyInMin,
          event.buyInMax,
          event.blinds,
          inviteEventDetails,
          event.announcementPostAt
        )
      ).catch(console.error);

      message = 'Your registration for this event has been confirmed.';
    }

    return NextResponse.json({
      event: updatedEvent,
      message: message,
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}