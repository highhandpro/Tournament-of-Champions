import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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

    // Find the original event
    const originalEvent = await Event.findById(id);
    if (!originalEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get current date for the duplicate name
    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Set the duplicated event date to tomorrow to avoid immediate archiving
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(20, 0, 0, 0); // Set to 8 PM tomorrow

    // Create the duplicated event with modified title
    const duplicatedEvent = await Event.create({
      title: `${originalEvent.title} duplicate-${dateString}`,
      dateTime: tomorrowDate, // Set to tomorrow to avoid archiving
      location: originalEvent.location,
      host: originalEvent.host,
      buyInMin: originalEvent.buyInMin,
      buyInMax: originalEvent.buyInMax,
      hospitalityFee: originalEvent.hospitalityFee,
      maxPlayers: originalEvent.maxPlayers,
      eventType: originalEvent.eventType,
      blinds: originalEvent.blinds,
      status: 'ACTIVE', // New events should be active
      registeredPlayers: [], // Empty registered players for new event
      invitedPlayers: [],
      gameTitle: originalEvent.gameTitle,
      gameDescription: originalEvent.gameDescription,
      gameRules: originalEvent.gameRules,
      gameNote: originalEvent.gameNote,
      details: originalEvent.details,
      details1: originalEvent.details1,
      details2: originalEvent.details2,
      details3: originalEvent.details3,
    });

    // Convert to plain object to ensure all fields are included
    const eventObject = duplicatedEvent.toObject({ virtuals: true });

    return NextResponse.json({
      event: eventObject,
      message: 'Event duplicated successfully'
    });

  } catch (error) {
    console.error('Duplicate event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}