import { NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

type Player = {
  name?: string;
  phone?: string;
  smsOptIn?: boolean;
};

export async function POST(req: Request) {
  try {
    const { event, players } = await req.json();

    if (!event || !Array.isArray(players)) {
      return NextResponse.json(
        { error: "Missing event or players array." },
        { status: 400 }
      );
    }

    const eligiblePlayers = players.filter(
      (player: Player) => player.phone && player.smsOptIn !== false
    );

    const message = `Ace Magnets Poker reminder:

${event.title || "Poker Night"}
${event.date || ""}
Cards in the air: ${event.startTime || "5 PM"}
Pizza: ${event.foodTime || "6 PM"}
Last hand: ${event.lastHand || "10:30 PM"}

Reply if you cannot make it.`;

    const results = await Promise.allSettled(
      eligiblePlayers.map((player: Player) =>
        sendSms(player.phone!, message)
      )
    );

    return NextResponse.json({
      success: true,
      totalPlayersReceived: players.length,
      eligiblePlayers: eligiblePlayers.length,
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    });
  } catch (error) {
    console.error("Send event SMS failed:", error);

    return NextResponse.json(
      { error: "Failed to send event SMS." },
      { status: 500 }
    );
  }
}