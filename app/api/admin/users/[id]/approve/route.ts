import { getApprovalEmail, sendEmail } from '@/lib/email';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
      const { id } = await Promise.resolve(context.params);
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!token.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectToDatabase();

    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already approved
    if (user.approvalStatus === 'APPROVED') {
      return NextResponse.json(
        { error: 'User is already approved' },
        { status: 400 }
      );
    }

    // Update user status
    user.approvalStatus = 'APPROVED';
    await user.save();

    // Send approval email (fire & forget)
    sendEmail(
      getApprovalEmail(user.firstName, user.email)
    ).catch(console.error);

    return NextResponse.json({
      message: 'User approved successfully',
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        approvalStatus: user.approvalStatus
      }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}