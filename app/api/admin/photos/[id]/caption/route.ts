import connectToDatabase from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
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
    const body = await request.json();
    const { caption } = body;

    if (caption !== undefined && caption.length > 500) {
      return NextResponse.json(
        { error: 'Caption cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    const photo = await Photo.findByIdAndUpdate(
      id,
      { caption: caption?.trim() || undefined },
      { new: true }
    );

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Caption updated', photo });
  } catch (error) {
    console.error('Update caption error:', error);
    return NextResponse.json(
      { error: 'Failed to update caption' },
      { status: 500 }
    );
  }
}
