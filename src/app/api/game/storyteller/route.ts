import { NextRequest, NextResponse } from "next/server";
import type { PlayerId, CardId } from "@/lib/types";
import { storytellerPickCard } from "@/lib/ai-player";

export async function POST(req: NextRequest) {
  try {
    const { playerId, hand } = (await req.json()) as {
      playerId: PlayerId;
      hand: CardId[];
    };

    const result = await storytellerPickCard(playerId, hand);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Storyteller API error:", error);
    return NextResponse.json(
      { error: "Failed to get storyteller decision" },
      { status: 500 }
    );
  }
}
