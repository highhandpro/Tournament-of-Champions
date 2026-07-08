import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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

    // Get all users
    const users = await User.find({}).select('firstName lastName email phoneNumber approvalStatus').sort({ createdAt: -1 });

    // Create CSV content
    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Approval Status'];
    const csvRows = users.map(user => [
      user.firstName,
      user.lastName.charAt(0) + '.', // Last initial only
      user.email,
      user.phoneNumber,
      user.approvalStatus
    ]);

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create response with CSV file
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="members-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}