import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token || !token.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  await connectToDatabase();
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  
  return NextResponse.json({ users, count: users.length });
}