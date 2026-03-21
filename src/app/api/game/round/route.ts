import type { PlayerId, Player, RoundResult } from "@/lib/types";
import { buildDeck, shuffle, dealHands, shuffleFaceUpCards, calculateScores } from "@/lib/game-engine";
import { storytellerPickCard, selectCard, voteForCard } from "@/lib/ai-player";

const PLAYER_NAMES = ["Dreamer", "Analyst", "Poet", "Trickster"];

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`)
        );
      }

      try {
        // 1. Build and shuffle deck, deal 4 hands of 6
        const deck = shuffle(buildDeck());
        const { hands } = dealHands(deck, 4, 6);

        const players: Player[] = hands.map((hand, i) => ({
          id: i as PlayerId,
          name: PLAYER_NAMES[i],
          hand,
          playerType: "ai" as const,
        }));

        send("setup", { players });

        // 2. Pick storyteller (player 0) and get their clue
        const storytellerId: PlayerId = 0;
        send("phase", { phase: "storyteller-thinking", playerName: PLAYER_NAMES[storytellerId] });

        const storytellerResult = await storytellerPickCard(
          storytellerId,
          players[storytellerId].hand
        );

        send("clue", { clue: storytellerResult.clue, storytellerName: PLAYER_NAMES[storytellerId] });

        // 3. Other players select cards (parallel — each player only sees their own hand + clue)
        const nonStorytellers = players.filter((p) => p.id !== storytellerId);
        send("phase", { phase: "selecting", playerNames: nonStorytellers.map((p) => p.name) });
        const cardSelections = await Promise.all(
          nonStorytellers.map((player) =>
            selectCard(player.id, player.hand, storytellerResult.clue)
          )
        );

        // 4. Collect submissions and shuffle face-up
        const submissions = [
          { cardId: storytellerResult.chosenCard, submittedBy: storytellerId },
          ...cardSelections.map((s) => ({
            cardId: s.chosenCard,
            submittedBy: s.playerId,
          })),
        ];
        const faceUpCards = shuffleFaceUpCards(submissions);

        // 5. Non-storytellers vote (parallel — each voter sees the same face-up cards independently)
        send("phase", { phase: "voting" });
        const votes = await Promise.all(
          cardSelections.map((selection) =>
            voteForCard(
              selection.playerId,
              faceUpCards,
              selection.chosenCard,
              storytellerResult.clue
            )
          )
        );

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

        send("complete", result);
        controller.close();
      } catch (error) {
        console.error("Round error:", error);
        send("error", { message: "Failed to run game round" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
