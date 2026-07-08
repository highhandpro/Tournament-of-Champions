import connectToDatabase from "@/lib/mongodb";
import Host from "@/models/Host";
import '@/models/User';
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest  
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const hosts = await Host.find()
      .populate('user', 'firstName lastName email')
      .populate('tier1', 'firstName lastName email')
      .populate('tier2', 'firstName lastName email');

    if (!hosts) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ hosts, count: hosts.length });
  } catch (error) {
    console.error('Get all host error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}