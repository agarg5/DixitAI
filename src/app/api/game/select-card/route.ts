import { NextRequest, NextResponse } from "next/server";
import type { PlayerId, CardId } from "@/lib/types";
import { selectCard } from "@/lib/ai-player";

export async function POST(req: NextRequest) {
  try {
    const { playerId, hand, clue } = (await req.json()) as {
      playerId: PlayerId;
      hand: CardId[];
      clue: string;
    };

    const result = await selectCard(playerId, hand, clue);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Card selection API error:", error);
    return NextResponse.json(
      { error: "Failed to get card selection" },
      { status: 500 }
    );
  }
}
