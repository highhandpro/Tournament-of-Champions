import { getEventInvitationEmail, sendEmail } from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
// import "@/models/Host";
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

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(playerId)) {
      return NextResponse.json(
        { error: 'Invalid event ID or player ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot send invitations for archived events' },
        { status: 400 }
      );
    }

    const user = await User.findById(playerId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isAlreadyRegistered = event.registeredPlayers.some(
      (p: any) => p.toString() === playerId
    );
    if (isAlreadyRegistered) {
      return NextResponse.json(
        { error: 'Player is already registered for this event' },
        { status: 400 }
      );
    }

    const isInWaitlist = event.waitlist.some(
      (p: any) => p.toString() === playerId
    );
    if (isInWaitlist) {
      return NextResponse.json(
        { error: 'Player is already in the waitlist' },
        { status: 400 }
      );
    }

    const isAlreadyInvited = event.invitedPlayers.some(
      (p: any) => p.toString() === playerId
    );
    if (isAlreadyInvited) {
      return NextResponse.json(
        { error: 'Player has already been invited' },
        { status: 400 }
      );
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $addToSet: { invitedPlayers: playerId } },
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
    const emailSent = await sendEmail(
      getEventInvitationEmail(
        user.firstName,
        user.email,
        event.title,
        event.dateTime,
        event.location,
        event._id.toString(),
        user._id.toString(),
        updatedEvent.host,
        event.buyInMin,
        event.buyInMax,
        event.blinds,
        inviteEventDetails
      )
    )

    console.log("emailSent ==>", emailSent);
    if (!emailSent)
      console.log("Failed to send the invitation")

    return NextResponse.json({
      event: updatedEvent,
      message: 'Invitation sent successfully',
    });

  } catch (error) {
    console.error('Send invitation error:', error);
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

    if (!token?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invitedPlayers.some((p: any) => p.toString() === playerId);
    if (!isInvited) {
      return NextResponse.json({ error: "Player is not invited to this event" }, { status: 400 });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { invitedPlayers: playerId } },
      { new: true }
    )
      .populate("registeredPlayers", "firstName lastName email")
      .populate("invitedPlayers", "firstName lastName email")
      .populate("waitlist", "firstName lastName email");

    return NextResponse.json({
      event: updatedEvent,
      message: "Invitation removed successfully",
    });
  } catch (error) {
    console.error("Remove invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
