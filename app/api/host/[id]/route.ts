import connectToDatabase from "@/lib/mongodb";
import Host from "@/models/Host";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const host = await Host.findOne({ user: params.id })
      .populate('user', 'firstName lastName email')
      .populate('tier1', 'firstName lastName email')
      .populate('tier2', 'firstName lastName email');

    if (!host) {
      return NextResponse.json(
        { error: 'Host not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(host);

  } catch (error) {
    console.error('Get host by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
 
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 });
    }
 
    const body = await request.json();
    const update: any = {};
    if (Array.isArray(body.tier1)) update.tier1 = body.tier1;
    if (Array.isArray(body.tier2)) update.tier2 = body.tier2;
 
    await connectToDatabase();
 
    const host = await Host.findByIdAndUpdate(params.id, update, { new: true })
      .populate("user", "firstName lastName email")
      .populate("tier1", "firstName lastName email")
      .populate("tier2", "firstName lastName email");
 
    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }
 
    return NextResponse.json(host);
  } catch (error) {
    console.error("Update host tiers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}