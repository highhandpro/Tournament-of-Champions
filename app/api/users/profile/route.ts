import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { firstName, lastName, phoneNumber, notes } = await request.json();

    // Phone number validation if provided
    if (phoneNumber !== undefined) {
      if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        );
      }

      // Extract digits only and validate
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits' },
          { status: 400 }
        );
      }
    }

    // Find and update user by email (since NextAuth stores email in token)
    const user = await User.findOne({ email: token.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update fields if provided
    if (firstName !== undefined) {
      if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
        return NextResponse.json(
          { error: 'First name is required' },
          { status: 400 }
        );
      }
      user.firstName = firstName.trim();
    }
    if (lastName !== undefined) {
      if (!lastName || typeof lastName !== 'string' || !lastName.trim()) {
        return NextResponse.json(
          { error: 'Last name is required' },
          { status: 400 }
        );
      }
      user.lastName = lastName.trim();
    }
    if (phoneNumber !== undefined) {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // Check if phone number is already used by another user
      const existingUserWithPhone = await User.findOne({
        phoneNumber: digitsOnly,
        _id: { $ne: user._id } // Exclude current user
      });
      
      if (existingUserWithPhone) {
        return NextResponse.json(
          { error: 'Phone number is already in use by another user' },
          { status: 409 }
        );
      }
      
      user.phoneNumber = digitsOnly; // Store as digits only
    }
    if (notes !== undefined) user.notes = notes?.trim() || '';

    await user.save();

    // Return updated user data (without password)
    const userResponse = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      user: userResponse,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}