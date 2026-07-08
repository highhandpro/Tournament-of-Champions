import connectToDatabase from '@/lib/mongodb';
import Host from '@/models/Host';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

  if (!token?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const { phoneNumber, firstName, lastName, email, role, notes, password } = await request.json();

    // Find and update user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update phone number if provided
    if (phoneNumber !== undefined) {
      if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
        return NextResponse.json(
          { error: 'Phone number is required' },
          { status: 400 }
        );
      }

      // Phone number validation - extract digits only and validate
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits' },
          { status: 400 }
        );
      }

      // Check if phone number already exists (excluding current user)
      const existingUser = await User.findOne({
        phoneNumber: digitsOnly,
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Phone number already in use by another user' },
          { status: 400 }
        );
      }

      user.phoneNumber = digitsOnly; // Store as digits only
    }

    // Update first name if provided
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return NextResponse.json(
          { error: 'First name cannot be empty' },
          { status: 400 }
        );
      }
      if (firstName.length > 50) {
        return NextResponse.json(
          { error: 'First name cannot exceed 50 characters' },
          { status: 400 }
        );
      }
      user.firstName = firstName.trim();
    }

    // Update last name if provided
    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return NextResponse.json(
          { error: 'Last name cannot be empty' },
          { status: 400 }
        );
      }
      if (lastName.length > 50) {
        return NextResponse.json(
          { error: 'Last name cannot exceed 50 characters' },
          { status: 400 }
        );
      }
      user.lastName = lastName.trim();
    }

    // Update email if provided
    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: 'Email cannot be empty' },
          { status: 400 }
        );
      }
      
      // Email validation
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      // Check if email already exists (excluding current user)
      const existingUserWithEmail = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUserWithEmail) {
        return NextResponse.json(
          { error: 'Email already in use by another user' },
          { status: 400 }
        );
      }

      user.email = email.toLowerCase();
    }

    // Update notes if provided
    if (notes !== undefined) {
      if (notes.length > 500) {
        return NextResponse.json(
          { error: 'Notes cannot exceed 500 characters' },
          { status: 400 }
        );
      }
      user.notes = notes.trim();
    }

    if (role !== undefined) {
      if (!['ADMIN', "MEMBER", 'SUB_ADMIN'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be ADMIN, SUB ADMIN or MEMBER ' },
          { status: 400 }
        );
      }
      if (["SUB_ADMIN", "ADMIN"].includes(role)) {
        const userId = new mongoose.Types.ObjectId(id);
        const host = { user: userId, address: "", tier1: [], tier2: [] }
        const isHostExists = await Host.findOne({ user: userId })

        if (!isHostExists)
          await Host.create(host)
      }
      user.role = role;
    }

    // Update password if provided
    if (password !== undefined) {
      if (!password.trim()) {
        return NextResponse.json(
          { error: 'Password cannot be empty' },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      // Hash the password before saving (same as reset password flow)
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
    }

    await user.save();

    // Return updated user data (without password)
    const userResponse = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      notes: user.notes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      user: userResponse,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Admin update phone error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}