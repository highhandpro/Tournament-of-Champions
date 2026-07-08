import connectToDatabase from '@/lib/mongodb';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Photo from '@/models/Photo';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No photo file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 10MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { publicId, url } = await uploadToCloudinary(buffer, file.name);

    const photo = await Photo.create({
      uploadedBy: token.sub,
      cloudinaryPublicId: publicId,
      cloudinaryUrl: url,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      caption: caption?.trim() || undefined,
    });

    return NextResponse.json({
      message: 'Photo uploaded successfully. It will be visible after admin approval.',
      photo: {
        _id: photo._id,
        cloudinaryUrl: photo.cloudinaryUrl,
        caption: photo.caption,
        approvalStatus: photo.approvalStatus,
        createdAt: photo.createdAt,
      },
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
