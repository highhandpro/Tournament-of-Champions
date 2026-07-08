import connectToDatabase from "@/lib/mongodb";
import AdminDismissals from "@/models/AdminDismissals";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 });
    }
    if (!token.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectToDatabase();
    const doc = await AdminDismissals.findOne({ adminEmail: token.email }).lean();

    return NextResponse.json({
      seenEventIds: doc?.seenEventIds || [],
      dismissedDays: doc?.dismissedDays || [],
    });
  } catch (error) {
    console.error("dismissals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: "No valid session found" }, { status: 401 });
    }
    if (!token.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { seenEventIds, dismissedDays } = body;

    await connectToDatabase();

    const update: Record<string, any> = {};
    if (Array.isArray(seenEventIds)) update.seenEventIds = seenEventIds;
    if (Array.isArray(dismissedDays)) update.dismissedDays = dismissedDays;

    await AdminDismissals.findOneAndUpdate(
      { adminEmail: token.email },
      { $set: update },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("dismissals PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
