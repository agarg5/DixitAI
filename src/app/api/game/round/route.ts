import type { PlayerId, Player, RoundResult } from "@/lib/types";
import { buildDeck, shuffle, dealHands, shuffleFaceUpCards, calculateScores } from "@/lib/game-engine";
import { storytellerPickCard, selectCard, voteForCard } from "@/lib/ai-player";

const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dave"];

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

        // 3. Other players select cards
        const cardSelections = [];
        for (const player of players) {
          if (player.id === storytellerId) continue;
          send("phase", { phase: "selecting", playerName: player.name });
          const selection = await selectCard(
            player.id,
            player.hand,
            storytellerResult.clue
          );
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
        send("phase", { phase: "voting" });
        const votes = [];
        for (const selection of cardSelections) {
          const vote = await voteForCard(
            selection.playerId,
            faceUpCards,
            selection.chosenCard,
            storytellerResult.clue
          );
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
