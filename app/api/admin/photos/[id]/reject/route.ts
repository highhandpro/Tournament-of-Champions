import connectToDatabase from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const photo = await Photo.findByIdAndUpdate(
      id,
      { approvalStatus: 'REJECTED' },
      { new: true }
    );

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Photo rejected', photo });
  } catch (error) {
    console.error('Reject photo error:', error);
    return NextResponse.json(
      { error: 'Failed to reject photo' },
      { status: 500 }
    );
  }
}
