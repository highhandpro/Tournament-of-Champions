import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import Host from '@/models/Host';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(context.params);

    await connectToDatabase();

    const event = await Event
      .findById(id)
      .populate('registeredPlayers', 'firstName lastName')
      .populate('invitedPlayers', 'firstName lastName')
      .populate('waitlist', 'firstName lastName')
      .populate({
        path: 'host',
        populate: { path: 'user', select: 'firstName lastName email' }
      });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Authorization check for private events
    if (event.isPrivate) {
      let isAuthorized = false;
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (token?.email) {
        const currentUser = await User.findOne({ email: token.email.toLowerCase() });
        if (currentUser) {
          const userId = currentUser._id.toString();

          // Admin check
          if (currentUser.role === 'ADMIN') {
            isAuthorized = true;
          }

          // Sub-admin check (event host)
          if (!isAuthorized && currentUser.role === 'SUB_ADMIN') {
            const host = await Host.findOne({ user: currentUser._id });
            const eventHostId = event.host && (event.host._id || event.host).toString();
            if (host && eventHostId === host._id.toString()) {
              isAuthorized = true;
            }
          }

          // Invited, registered, waitlisted check
          if (!isAuthorized) {
            const isInvited = event.invitedPlayers.some((p: any) => p._id.toString() === userId);
            const isRegistered = event.registeredPlayers.some((p: any) => p._id.toString() === userId);
            const isWaitlisted = event.waitlist.some((p: any) => p._id.toString() === userId);
            if (isInvited || isRegistered || isWaitlisted) {
              isAuthorized = true;
            }
          }
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }
    }

    // Auto-archive
    const now = new Date();
    if (event.status === 'ACTIVE' && event.dateTime < now) {
      event.status = 'ARCHIVED';
      await event.save();
    }

    const eventObj = event.toObject({ virtuals: true });
    return NextResponse.json({
      event: {
        ...eventObj,
        dateTime: event.dateTime.toISOString(),
        details1: eventObj.details1 || null,
        details2: eventObj.details2 || null,
        details3: eventObj.details3 || null,
      },
    });

  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
