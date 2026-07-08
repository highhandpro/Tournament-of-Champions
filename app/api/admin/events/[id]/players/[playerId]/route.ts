import { getEventNewSetForWailistPlayerEmail, getEventRegistrationEmail, sendEmail } from '@/lib/email';
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
  context: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await context.params;

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { error: 'Invalid player ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event is archived
    if (event.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot add players to archived events' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(playerId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already registered
    const isAlreadyRegistered = event.registeredPlayers.some(
      (p: any) => p.toString() === playerId
    );

    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'Player is already registered for this event' },
        { status: 400 }
      );
    }
    const isInWaitlist = event.waitlist.some((p: any) => p.toString() === playerId);
    let updatedEvent;
    let message;

    if (isInWaitlist) {
      return NextResponse.json(
        { error: 'Player is already in the waitlist' },
        { status: 400 }
      );
    }
    if (event.registeredPlayers.length >= event.maxPlayers) {
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $addToSet: { waitlist: playerId } },
        { new: true }
      )
      .populate('registeredPlayers', 'firstName lastName email')
      .populate('invitedPlayers', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email');

      await logRegistrationAction({
        event,
        user,
        action: 'ADMIN_WAITLISTED',
        actor: { email: token.email ?? undefined },
      });
      
      message = 'Player added to waitlist successfully';
    } else {
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $push: { registeredPlayers: playerId } },
        { new: true }
      )
      .populate('registeredPlayers', 'firstName lastName email')
      .populate('invitedPlayers', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email')
      .populate({
        path: 'host',
        populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
      });
  
      const eventDetails = [updatedEvent.details, updatedEvent.details1, updatedEvent.details2, updatedEvent.details3].filter(Boolean).join('<br>');
      await logRegistrationAction({
        event: updatedEvent,
        user,
        action: 'ADMIN_REGISTERED',
        actor: { email: token.email ?? undefined },
      });
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
      message = 'Player added to event successfully';
    }
    return NextResponse.json({
      event: updatedEvent,
      message: message,
    });

  } catch (error) {
    console.error('Add player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const { id, playerId } = await context.params;
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.email)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 } );
    if (!token.isAdmin)
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 } );
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(playerId))
      return NextResponse.json(
        { error: 'Invalid event ID or player ID' },
        { status: 400 }
      );

    await connectToDatabase();

    const event = await Event.findById(id);

    if (!event)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 } );
    if (event.status === 'ARCHIVED')
      return NextResponse.json(
        { error: 'Cannot remove players from archived events' },
        { status: 400 }
      );
    const user = await User.findById(playerId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const isRegistered = event.registeredPlayers.some((p: any) => p.toString() === playerId);

    if (!isRegistered) {
      return NextResponse.json(
        { error: 'Player is not registered for this event' },
        { status: 400 }
      );
    }

    let updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { registeredPlayers: playerId } },
      { new: true }
    ).populate('registeredPlayers', 'firstName lastName email')
     .populate('waitlist', 'firstName lastName email');

    if (updatedEvent.waitlist.length > 0 && updatedEvent.registeredPlayers.length < updatedEvent.maxPlayers) {
      const firstWaitlistUser = updatedEvent.waitlist[0];
    
      updatedEvent = await Event.findByIdAndUpdate(
        id,
        {
          $pull: { waitlist: firstWaitlistUser._id },
          $addToSet: { registeredPlayers: firstWaitlistUser._id }
        },
        { new: true }
      )
        .populate('registeredPlayers', 'firstName lastName email')
        .populate('waitlist', 'firstName lastName email')
        .populate({
          path: 'host',
          populate: { path: 'user', select: 'firstName lastName email phoneNumber' }
        });
      
      const waitlistUser = await User.findById(firstWaitlistUser._id);

      if (waitlistUser) {
        await logRegistrationAction({
          event: updatedEvent,
          user: waitlistUser,
          action: 'PROMOTED_FROM_WAITLIST',
          actor: { email: token.email ?? undefined },
        });
      }
      
      if (waitlistUser) {
        const waitlistEventDetails = [updatedEvent.details, updatedEvent.details1, updatedEvent.details2, updatedEvent.details3].filter(Boolean).join('<br>');
        sendEmail(
          getEventNewSetForWailistPlayerEmail(
            waitlistUser.firstName,
            waitlistUser.email,
            updatedEvent.title,
            updatedEvent.dateTime,
            updatedEvent.location,
            updatedEvent.host,
            updatedEvent.buyInMin,
            updatedEvent.buyInMax,
            updatedEvent.blinds,
            waitlistEventDetails,
            updatedEvent._id.toString()
          )
        ).catch(console.error);
      }
    }

    await logRegistrationAction({
      event,
      user,
      action: 'ADMIN_UNREGISTERED',
      actor: { email: token.email ?? undefined },
    });
    return NextResponse.json({
      event: updatedEvent,
      message: 'Player removed from event successfully',
    });

  } catch (error) {
    console.error('Remove player error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
