import { NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

export async function POST(req: Request) {
  try {
    const { to } = await req.json();

    const result = await sendSms(
      to,
      "Ace Magnets Poker: SMS test successful."
    );

    return NextResponse.json({
      success: true,
      sid: result.sid,
    });
  } catch (err) {
    console.error("SMS test failed:", err);

    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}