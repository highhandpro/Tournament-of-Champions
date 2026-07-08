import connectToDatabase from '@/lib/mongodb';
import RegistrationLog from '@/models/RegistrationLog';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
    }

    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (eventId) query.event = eventId;
    if (userId) query.user = userId;
    if (action) query.action = action;

    const logs = await RegistrationLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('event', 'title dateTime location')
      .populate('user', 'firstName lastName email')
      .populate('actorUser', 'firstName lastName email')
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('registration-logs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
