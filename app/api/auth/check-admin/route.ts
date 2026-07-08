import connectToDatabase from '@/lib/mongodb';
import Host from '@/models/Host';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json({ isAdmin: false });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: token.email as string });

    if (!user) {
      return NextResponse.json({ isAdmin: false, isSubAdmin: false });
    }

    const result: any = {
      isAdmin: user.role === 'ADMIN',
      isSubAdmin: user.role === 'SUB_ADMIN',
    };

    // If sub-admin, also return their host ID so they can filter upcoming events
    if (user.role === 'SUB_ADMIN') {
      const host = await Host.findOne({ user: user._id });
      if (host) {
        result.hostId = host._id.toString();
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Check admin error:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
