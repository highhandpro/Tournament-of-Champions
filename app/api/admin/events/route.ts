import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const parseOptionalDate = (value: any) => {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
};

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

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

    await connectToDatabase();

    const {
      title,
      dateTime,
      location,
      buyInMin,
      buyInMax,
      hospitalityFee,
      maxPlayers,
      eventType,
      blinds,
      details,
      details1,
      details2,
      details3,
      links,
      host,
      announcementTier1At,
      announcementTier2At,
      announcementPostAt,
      reminderAt,
      doNotAnnounce,
      isPrivate,
    } = await request.json();

    // Validation
    if (!title || !dateTime || !location || !host || buyInMin === undefined || buyInMax === undefined || !maxPlayers || !eventType) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const tier1Date = parseOptionalDate(announcementTier1At);
    if (tier1Date === null) {
      return NextResponse.json({ error: 'Invalid announcementTier1At' }, { status: 400 });
    }
    
    const tier2Date = parseOptionalDate(announcementTier2At);
    if (tier2Date === null) {
      return NextResponse.json({ error: 'Invalid announcementTier2At' }, { status: 400 });
    }
    
    const postDate = parseOptionalDate(announcementPostAt);
    if (postDate === null) {
      return NextResponse.json({ error: 'Invalid announcementPostAt' }, { status: 400 });
    }
    
    const reminderDate = parseOptionalDate(reminderAt);
    if (reminderDate === null) {
      return NextResponse.json({ error: 'Invalid reminderAt' }, { status: 400 });
    }

    // Validate data types
    if (typeof maxPlayers !== 'number') {
      return NextResponse.json(
        { error: 'Max players must be a number' },
        { status: 400 }
      );
    }

    // Validate buy-in amounts if provided
    if (buyInMin !== undefined && buyInMax !== undefined) {
      if (typeof buyInMin !== 'number' || typeof buyInMax !== 'number') {
        return NextResponse.json(
          { error: 'Buy-in amounts must be numbers' },
          { status: 400 }
        );
      }
      
      if (buyInMax < buyInMin) {
        return NextResponse.json(
          { error: 'Maximum buy-in must be greater than or equal to minimum buy-in' },
          { status: 400 }
        );
      }
    }

    // Validate hospitality fee if provided
    // if (hospitalityFee !== undefined && hospitalityFee !== null) {
    //   if (typeof hospitalityFee !== 'number') {
    //     return NextResponse.json(
    //       { error: 'Hospitality fee must be a number' },
    //       { status: 400 }
    //     );
    //   }
      
    //   if (hospitalityFee < 0) {
    //     return NextResponse.json(
    //       { error: 'Hospitality fee cannot be negative' },
    //       { status: 400 }
    //     );
    //   }
    // }

    // Validate max players range
    if (maxPlayers < 1 || maxPlayers > 100) {
      return NextResponse.json(
        { error: 'Max players must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Create event
    const event = await Event.create({
      title: title.trim(),
      dateTime: new Date(dateTime),
      location: location.trim(),
      host,
      announcementTier1At: tier1Date,
      announcementTier2At: tier2Date,
      announcementPostAt: postDate,
      reminderAt: reminderDate,
      buyInMin: buyInMin !== undefined ? buyInMin : undefined,
      buyInMax: buyInMax !== undefined ? buyInMax : undefined,
      hospitalityFee: hospitalityFee !== undefined ? hospitalityFee : undefined,
      maxPlayers,
      eventType,
      blinds: blinds?.trim() || undefined,
      details: details?.trim() || undefined,
      details1: details1?.trim() || undefined,
      details2: details2?.trim() || undefined,
      details3: details3?.trim() || undefined,
      links: links || [],
      doNotAnnounce: doNotAnnounce === true,
      isPrivate: isPrivate === true,
      status: 'ACTIVE',
      registeredPlayers: [],
      invitedPlayers: [],
    });

    // Convert to plain object to ensure all fields are included
    const eventObject = event.toObject({ virtuals: true });

    return NextResponse.json({
      event: eventObject,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}