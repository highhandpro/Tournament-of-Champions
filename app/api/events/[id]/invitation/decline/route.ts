import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
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

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $pull: { invitedPlayers: userId } },
      { new: true }
    )
      .populate('registeredPlayers', 'firstName lastName email')
      .populate('invitedPlayers', 'firstName lastName email')
      .populate('waitlist', 'firstName lastName email');

    return NextResponse.json({
      event: updatedEvent,
      message: 'Invitation declined successfully',
    });

  } catch (error) {
    console.error('Decline invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}