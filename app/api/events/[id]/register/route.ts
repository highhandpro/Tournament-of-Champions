import {
  getEventNewSetForWailistPlayerEmail,
  getEventRegistrationEmail,
  getEventRegistrationNotificationEmail,
  getEventUnregistrationConfirmationEmail,
  getEventUnregistrationNotificationEmail,
  sendEmail,
} from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import { logRegistrationAction } from '@/lib/registrationTracking';
import Event from '@/models/Event';
import '@/models/Host';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

function buildEventDetails(event: any) {
  return [event.details, event.details1, event.details2, event.details3]
    .filter(Boolean)
    .join('<br>');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Please log in to register for events' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let updatedEvent: any = null;
    let user: any = null;
    let action: 'REGISTERED' | 'WAITLISTED' | null = null;
    let message = '';

    await session.withTransaction(async () => {
      user = await User.findOne({ email: token.email }).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const event = await Event.findById(id).session(session);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'ACTIVE') {
        throw new Error('Cannot register for archived events');
      }

      if (event.isPrivate) {
        const userId = user._id.toString();
        const isInvited = event.invitedPlayers.some(
          (playerId: any) => playerId.toString() === userId
        );
        if (!isInvited) {
          throw new Error('This event is private and by invitation only');
        }
      }

      if (event.announcementTier1At && new Date(event.announcementTier1At) > new Date()) {
        throw new Error('Cannot register for events that have not been announced yet');
      }

      const now = new Date();
      if (event.dateTime < now) {
        throw new Error('Cannot register for events that have already started');
      }

      const userId = user._id.toString();

      const isAlreadyRegistered = event.registeredPlayers.some(
        (playerId: any) => playerId.toString() === userId
      );
      if (isAlreadyRegistered) {
        throw new Error('You are already registered for this event');
      }

      const isInWaitlist = event.waitlist.some(
        (playerId: any) => playerId.toString() === userId
      );
      if (isInWaitlist) {
        throw new Error('You are already on the waitlist for this event');
      }

      if (event.registeredPlayers.length >= event.maxPlayers) {
        updatedEvent = await Event.findByIdAndUpdate(
          id,
          { $addToSet: { waitlist: userId } },
          { new: true, session }
        )
          .populate('registeredPlayers', 'firstName lastName email')
          .populate('invitedPlayers', 'firstName lastName email')
          .populate('waitlist', 'firstName lastName email');

        await logRegistrationAction({
          event,
          user,
          action: 'WAITLISTED',
          actor: { email: token.email ?? undefined },
          session,
        });

        message = 'Successfully added to waitlist';
      } else {
        updatedEvent = await Event.findByIdAndUpdate(
          id,
          { $addToSet: { registeredPlayers: userId } },
          { new: true, session }
        )
          .populate('registeredPlayers', 'firstName lastName email')
          .populate('invitedPlayers', 'firstName lastName email')
          .populate('waitlist', 'firstName lastName email')
          .populate({
            path: 'host',
            populate: { path: 'user', select: 'firstName lastName email phoneNumber' },
          });

        await logRegistrationAction({
          event: updatedEvent,
          user,
          action: 'REGISTERED',
          actor: { email: token.email ?? undefined },
          session,
        });

        action = 'REGISTERED';
        message = 'Successfully registered for event';
      }
    });

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Unable to update event' }, { status: 500 });
    }

    if (action === 'REGISTERED') {
      const eventDetails = buildEventDetails(updatedEvent);

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

      sendEmail(
        getEventRegistrationNotificationEmail(
          user.firstName,
          user.lastName,
          user.email,
          updatedEvent.title,
          updatedEvent.dateTime,
          updatedEvent.location,
          updatedEvent.host
        )
      ).catch(console.error);
    }

    return NextResponse.json({
      event: updatedEvent,
      message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (
      message === 'User not found' ||
      message === 'Event not found' ||
      message === 'Cannot register for archived events' ||
      message === 'Cannot register for events that have not been announced yet' ||
      message === 'Cannot register for events that have already started' ||
      message === 'You are already registered for this event' ||
      message === 'You are already on the waitlist for this event'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Event registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession();

  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json(
        { error: 'Please log in to unregister from events' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let updatedEvent: any = null;
    let user: any = null;
    let waitlistPromotedUser: any = null;

    await session.withTransaction(async () => {
      user = await User.findOne({ email: token.email }).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const event = await Event.findById(id).session(session);
      if (!event) {
        throw new Error('Event not found');
      }

      if (event.status !== 'ACTIVE') {
        throw new Error('Cannot unregister from archived events');
      }

      const now = new Date();
      if (event.dateTime < now) {
        throw new Error('Cannot unregister from events that have already started');
      }

      const userId = user._id.toString();

      const isRegistered = event.registeredPlayers.some(
        (playerId: any) => playerId.toString() === userId
      );

      if (!isRegistered) {
        const isInWaitlist = event.waitlist.some(
          (playerId: any) => playerId.toString() === userId
        );

        if (isInWaitlist) {
          updatedEvent = await Event.findByIdAndUpdate(
            id,
            { $pull: { waitlist: userId } },
            { new: true, session }
          )
            .populate('registeredPlayers', 'firstName lastName email')
            .populate('invitedPlayers', 'firstName lastName email')
            .populate('waitlist', 'firstName lastName email');

          await logRegistrationAction({
            event,
            user,
            action: 'WAITLIST_LEFT',
            actor: { email: token.email ?? undefined },
            session,
          });

          return;
        }

        throw new Error('You are not registered for this event');
      }

      updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $pull: { registeredPlayers: userId } },
        { new: true, session }
      )
        .populate('registeredPlayers', 'firstName lastName email')
        .populate('invitedPlayers', 'firstName lastName email')
        .populate('waitlist', 'firstName lastName email')
        .populate({
          path: 'host',
          populate: { path: 'user', select: 'firstName lastName email phoneNumber' },
        });

      await logRegistrationAction({
        event,
        user,
        action: 'UNREGISTERED',
        actor: { email: token.email ?? undefined },
        session,
      });

      const unregEventDetails = buildEventDetails(event);
      sendEmail(
        getEventUnregistrationConfirmationEmail(
          user.firstName,
          user.email,
          event.title,
          event.dateTime,
          event.location,
          updatedEvent.host,
          event.buyInMin,
          event.buyInMax,
          event.blinds,
          unregEventDetails
        )
      ).catch(console.error);

      sendEmail(
        getEventUnregistrationNotificationEmail(
          user.firstName,
          user.lastName,
          user.email,
          event.title,
          event.dateTime,
          event.location,
          updatedEvent.host
        )
      ).catch(console.error);

      if (
        updatedEvent.waitlist.length > 0 &&
        updatedEvent.registeredPlayers.length < updatedEvent.maxPlayers
      ) {
        const firstWaitlistUser = updatedEvent.waitlist[0];
        waitlistPromotedUser = await User.findById(firstWaitlistUser._id).session(session);

        if (waitlistPromotedUser) {
          updatedEvent = await Event.findByIdAndUpdate(
            id,
            {
              $pull: { waitlist: firstWaitlistUser._id },
              $addToSet: { registeredPlayers: firstWaitlistUser._id },
            },
            { new: true, session }
          )
            .populate('registeredPlayers', 'firstName lastName email')
            .populate('invitedPlayers', 'firstName lastName email')
            .populate('waitlist', 'firstName lastName email')
            .populate({
              path: 'host',
              populate: { path: 'user', select: 'firstName lastName email phoneNumber' },
            });

          await logRegistrationAction({
            event,
            user: waitlistPromotedUser,
            action: 'PROMOTED_FROM_WAITLIST',
            actor: { email: token.email ?? undefined },
            session,
          });
        }
      }
    });

    if (!updatedEvent) {
      return NextResponse.json({ error: 'Unable to update event' }, { status: 500 });
    }

    if (waitlistPromotedUser) {
      const waitlistEventDetails = buildEventDetails(updatedEvent);
      sendEmail(
        getEventNewSetForWailistPlayerEmail(
          waitlistPromotedUser.firstName,
          waitlistPromotedUser.email,
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

    return NextResponse.json({
      event: updatedEvent,
      message: 'Successfully unregistered from event',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (
      message === 'User not found' ||
      message === 'Event not found' ||
      message === 'Cannot unregister from archived events' ||
      message === 'Cannot unregister from events that have already started' ||
      message === 'You are not registered for this event'
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Event unregistration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    session.endSession();
  }
}
