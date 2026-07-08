import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find event and populate registered players and waitlist
    const event = await Event.findById(id)
      .populate({
        path: 'registeredPlayers',
        model: User,
        select: 'firstName lastName email phoneNumber'
      })
      .populate({
        path: 'invitedPlayers',
        model: User,
        select: 'firstName lastName email phoneNumber'
      })
      .populate({
        path: 'waitlist',
        model: User,
        select: 'firstName lastName email phoneNumber'
      });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Format registered players data to show only last initial
    const players = event.registeredPlayers.map((player: any) => ({
      id: player._id.toString(),
      firstName: player.firstName,
      lastInitial: player.lastName.charAt(0).toUpperCase(),
      email: player.email,
      phoneNumber: player.phoneNumber
    }));

    // Format waitlist players data
    const waitlist = event.waitlist.map((player: any) => ({
      id: player._id.toString(),
      firstName: player.firstName,
      lastInitial: player.lastName.charAt(0).toUpperCase(),
      email: player.email,
      phoneNumber: player.phoneNumber
    }));

    return NextResponse.json({
      eventId: id,
      eventTitle: event.title,
      players,
      waitlist,
      totalPlayers: players.length,
      totalWaitlist: waitlist.length,
      maxPlayers: event.maxPlayers
    });

  } catch (error) {
    console.error('Get event players error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}