import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmail, getPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { email } = await request.json();

    // Validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Always return success message (don't reveal if email exists)
    const trimmedEmail = email.trim().toLowerCase();
    
    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });
    
    if (!user) {
      // Return generic success message even if email doesn't exist
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry (30 minutes from now)
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    // Save hashed token and expiry to user
    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send reset email (fire & forget)
    const emailResult = await sendEmail(getPasswordResetEmail(user.firstName, user.email, resetUrl));

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}