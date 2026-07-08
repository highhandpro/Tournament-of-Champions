// This endpoint is currently unused but kept for potential future use.
// Archived events are viewed individually via /api/events/[id]
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Use /api/events/[id] to fetch individual archived events" },
    { status: 410 },
  );
}
