import connectToDatabase from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED, or null for all

    const query: any = {};
    if (status) {
      query.approvalStatus = status;
    }

    const photos = await Photo.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Admin get photos error:', error);
    return NextResponse.json(
      { error: 'Failed to load photos' },
      { status: 500 }
    );
  }
}
