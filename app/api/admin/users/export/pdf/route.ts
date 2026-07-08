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

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Members List Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .status-approved { color: #28a745; font-weight: bold; }
          .status-pending { color: #ffc107; font-weight: bold; }
          .status-denied { color: #dc3545; font-weight: bold; }
          .export-date { text-align: right; color: #666; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Poker Club Members List</h1>
        <div class="export-date">Export Date: ${new Date().toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Initial</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Approval Status</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${user.firstName}</td>
                <td>${user.lastName.charAt(0)}.</td>
                <td>${user.email}</td>
                <td>${user.phoneNumber}</td>
                <td class="status-${user.approvalStatus.toLowerCase()}">${user.approvalStatus}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #666;">
          Total Members: ${users.length}
        </p>
      </body>
      </html>
    `;

    // Return HTML that can be printed to PDF by the browser
    const response = new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="members-export-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

    return response;

  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}