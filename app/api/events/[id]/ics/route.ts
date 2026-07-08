import { createIcsFile } from '@/lib/calendar';
import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await connectToDatabase();

    const event = await Event.findById(id).select(
      'title details location dateTime status'
    );

    if (!event) {
      return new NextResponse('Event not found', { status: 404 });
    }

    const icsContent = createIcsFile({
      title: event.title,
      description: event.details || 'Poker game — Ace Magnets Poker Club',
      location: event.location || '',
      startDate: new Date(event.dateTime),
    });

    // Sanitise the title for use as a filename
    const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeTitle}.ics"`,
      },
    });
  } catch (error) {
    console.error('ICS generation error:', error);
    return new NextResponse('Failed to generate calendar file', { status: 500 });
  }
}
