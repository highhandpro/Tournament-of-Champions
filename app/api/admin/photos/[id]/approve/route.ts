import connectToDatabase from '@/lib/mongodb';
import Photo from '@/models/Photo';
import User from '@/models/User';
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
    const adminUser = await User.findOne({ email: token.email });

    const photo = await Photo.findByIdAndUpdate(
      id,
      {
        approvalStatus: 'APPROVED',
        approvedBy: adminUser._id,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Photo approved', photo });
  } catch (error) {
    console.error('Approve photo error:', error);
    return NextResponse.json(
      { error: 'Failed to approve photo' },
      { status: 500 }
    );
  }
}
