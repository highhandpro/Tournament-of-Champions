import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import Host from '@/models/Host';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(token.id).select('role');
    if (!user || user.role !== 'SUB_ADMIN') {
      return NextResponse.json({ error: 'Sub-admin access required' }, { status: 403 });
    }

    // Find this user's Host document
    const host = await Host.findOne({ user: token.id });

    if (!host) {
      return NextResponse.json({ events: [], count: 0 });
    }

    // Fetch all archived events where this Host is the host
    const events = await Event.find({ status: 'ARCHIVED', host: host._id })
      .populate('registeredPlayers', 'firstName lastName email')
      .sort({ dateTime: -1 })
      .lean();

    const serialised = events.map((e: any) => ({
      ...e,
      _id: e._id.toString(),
      host: e.host?.toString(),
      dateTime: e.dateTime instanceof Date ? e.dateTime.toISOString() : e.dateTime,
      registeredPlayers: (e.registeredPlayers || []).map((p: any) =>
        typeof p === 'object' ? { ...p, _id: p._id?.toString() } : p
      ),
    }));

    return NextResponse.json({ events: serialised, count: serialised.length });
  } catch (error) {
    console.error('Sub-admin archived events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
