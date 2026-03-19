import { NextResponse } from "next/server";
import type { PlayerId, Player, RoundResult } from "@/lib/types";
import { buildDeck, shuffle, dealHands, shuffleFaceUpCards, calculateScores } from "@/lib/game-engine";
import { storytellerPickCard, selectCard, voteForCard } from "@/lib/ai-player";

const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dave"];

export async function POST() {
  try {
    // 1. Build and shuffle deck, deal 4 hands of 6
    const deck = shuffle(buildDeck());
    const { hands } = dealHands(deck, 4, 6);

    const players: Player[] = hands.map((hand, i) => ({
      id: i as PlayerId,
      name: PLAYER_NAMES[i],
      hand,
    }));

    // 2. Pick storyteller (player 0) and get their clue
    const storytellerId: PlayerId = 0;
    const storytellerResult = await storytellerPickCard(
      storytellerId,
      players[storytellerId].hand
    );

    console.log(`Storyteller (${PLAYER_NAMES[storytellerId]}) clue: "${storytellerResult.clue}"`);

    // 3. Other players select cards
    const cardSelections = [];
    for (const player of players) {
      if (player.id === storytellerId) continue;
      const selection = await selectCard(
        player.id,
        player.hand,
        storytellerResult.clue
      );
      console.log(`${player.name} selected card ${selection.chosenCard}`);
      cardSelections.push(selection);
    }

    // 4. Collect submissions and shuffle face-up
    const submissions = [
      { cardId: storytellerResult.chosenCard, submittedBy: storytellerId },
      ...cardSelections.map((s) => ({
        cardId: s.chosenCard,
        submittedBy: s.playerId,
      })),
    ];
    const faceUpCards = shuffleFaceUpCards(submissions);

    // 5. Non-storytellers vote
    const votes = [];
    for (const selection of cardSelections) {
      const vote = await voteForCard(
        selection.playerId,
        faceUpCards,
        selection.chosenCard,
        storytellerResult.clue
      );
      console.log(`${PLAYER_NAMES[selection.playerId]} voted for card ${vote.votedCard}`);
      votes.push(vote);
    }

    // 6. Calculate scores
    const allPlayerIds = players.map((p) => p.id);
    const scores = calculateScores(
      storytellerId,
      storytellerResult.chosenCard,
      faceUpCards,
      votes,
      allPlayerIds
    );

    const result: RoundResult = {
      players,
      storyteller: storytellerResult,
      cardSelections,
      faceUpCards,
      votes,
      scores,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Round error:", error);
    return NextResponse.json(
      { error: "Failed to run game round" },
      { status: 500 }
    );
  }
}
