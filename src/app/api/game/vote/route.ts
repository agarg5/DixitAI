import { NextRequest, NextResponse } from "next/server";
import type { PlayerId, CardId, FaceUpCard } from "@/lib/types";
import { voteForCard } from "@/lib/ai-player";

export async function POST(req: NextRequest) {
  try {
    const { playerId, faceUpCards, ownCardId, clue } = (await req.json()) as {
      playerId: PlayerId;
      faceUpCards: FaceUpCard[];
      ownCardId: CardId;
      clue: string;
    };

    const result = await voteForCard(playerId, faceUpCards, ownCardId, clue);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { error: "Failed to get vote" },
      { status: 500 }
    );
  }
}
