import connectToDatabase from '@/lib/mongodb';
import { deleteFromCloudinary, uploadBannerToCloudinary } from '@/lib/cloudinary';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// POST /api/admin/events/[id]/banner — upload (or replace) the banner image
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('banner') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No banner file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are allowed' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be under 10 MB' }, { status: 400 });
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete existing banner from Cloudinary if present
    if (event.bannerImagePublicId) {
      await deleteFromCloudinary(event.bannerImagePublicId).catch(() => {
        // Non-fatal — old file may already be gone
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicId, url } = await uploadBannerToCloudinary(buffer, file.name);

    event.bannerImageUrl = url;
    event.bannerImagePublicId = publicId;
    await event.save();

    return NextResponse.json({ bannerImageUrl: url, bannerImagePublicId: publicId });
  } catch (error) {
    console.error('Banner upload error:', error);
    return NextResponse.json({ error: 'Failed to upload banner' }, { status: 500 });
  }
}

// DELETE /api/admin/events/[id]/banner — remove the banner image
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!token.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    await connectToDatabase();

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.bannerImagePublicId) {
      await deleteFromCloudinary(event.bannerImagePublicId).catch(() => {});
    }

    event.bannerImageUrl = undefined;
    event.bannerImagePublicId = undefined;
    await event.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Banner delete error:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
