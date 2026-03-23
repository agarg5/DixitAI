"use client";

import type { CardId } from "@/lib/types";
import type { HumanRoundState } from "@/hooks/use-human-round";
import { Card } from "./card";
import { ClueInput } from "./clue-input";
import { HumanHand } from "./human-hand";
import { VotePicker } from "./vote-picker";
import { ClueBanner } from "./clue-banner";
import { GameBoard } from "./game-board";
import { ThinkingIndicator } from "./thinking-indicator";

interface HumanRoundViewProps {
  state: HumanRoundState;
  onSubmitStorytellerChoice: (card: CardId, clue: string) => void;
  onSubmitCardSelection: (card: CardId) => void;
  onSubmitVote: (card: CardId) => void;
  onNewRound: () => void;
}

const PLAYER_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-400" },
  { bg: "bg-emerald-500", text: "text-emerald-400" },
  { bg: "bg-purple-500", text: "text-purple-400" },
  { bg: "bg-rose-500", text: "text-rose-400" },
];

const PLAYER_AVATARS = ["🧑", "🔍", "✒️", "🃏"];

export function HumanRoundView({
  state,
  onSubmitStorytellerChoice,
  onSubmitCardSelection,
  onSubmitVote,
  onNewRound,
}: HumanRoundViewProps) {
  const { phase, players, storytellerId, clue, humanHand, faceUpCards, roundResult, error, isLoading } = state;

  if (error) {
    return (
      <div className="text-center mt-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={onNewRound}
          className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show results using the existing GameBoard
  if (phase === "results" && roundResult) {
    return <GameBoard roundResult={roundResult} onNewRound={onNewRound} />;
  }

  const storytellerName = players[storytellerId]?.name ?? "...";
  const humanIsStoryteller = storytellerId === 0;

  return (
    <div className="space-y-6">
      {/* Player bar */}
      {players.length > 0 && (
        <div className="flex justify-center gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border ${
                player.id === storytellerId
                  ? "border-amber-500/50 bg-amber-500/10"
                  : "border-zinc-800 bg-zinc-900/30"
              }`}
            >
              <span className="text-base leading-none" title={player.name}>
                {PLAYER_AVATARS[player.id]}
              </span>
              <span className={`text-xs font-medium ${PLAYER_COLORS[player.id].text}`}>
                {player.name}
              </span>
              {player.id === storytellerId && (
                <span className="text-[10px] text-amber-400">★</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phase: Dealing */}
      {phase === "dealing" && (
        <div className="text-center mt-12">
          <p className="text-zinc-400 animate-pulse">Dealing cards...</p>
        </div>
      )}

      {/* Phase: Human is storyteller */}
      {phase === "human-storyteller" && (
        <ClueInput hand={humanHand} onSubmit={onSubmitStorytellerChoice} />
      )}

      {/* Phase: AI is storyteller (waiting) */}
      {phase === "ai-storyteller" && (
        <div className="space-y-4">
          <ThinkingIndicator
            playerName={storytellerName}
            action="is thinking of a clue"
            visible
          />
          <p className="text-xs text-zinc-600 text-center">
            While you wait, here are your cards:
          </p>
          <div className="flex justify-center gap-3 flex-wrap opacity-60">
            {humanHand.map((cardId) => (
              <Card key={cardId} cardId={cardId} faceUp size="md" />
            ))}
          </div>
        </div>
      )}

      {/* Phase: Human selects card */}
      {phase === "human-select-card" && clue && !humanIsStoryteller && (
        <div className="space-y-4">
          <ClueBanner clue={clue} storytellerName={storytellerName} visible />
          <HumanHand
            hand={humanHand}
            onSelect={onSubmitCardSelection}
            prompt="Pick the card from your hand that best matches the clue."
          />
        </div>
      )}

      {/* Phase: AI selecting cards (waiting) */}
      {(phase === "ai-selecting") && (
        <div className="space-y-4">
          {clue && <ClueBanner clue={clue} storytellerName={storytellerName} visible />}
          <ThinkingIndicator
            playerName="AI players"
            action="are selecting their cards"
            visible
          />
        </div>
      )}

      {/* Phase: Revealing face-up cards */}
      {phase === "revealing" && (
        <div className="space-y-4">
          {clue && <ClueBanner clue={clue} storytellerName={storytellerName} visible />}
          <p className="text-sm text-zinc-400 text-center animate-pulse">
            Revealing cards...
          </p>
        </div>
      )}

      {/* Phase: Human votes */}
      {phase === "human-vote" && clue && (
        <div className="space-y-4">
          <VotePicker
            faceUpCards={faceUpCards}
            ownCardId={getHumanSubmittedCard(faceUpCards)}
            clue={clue}
            onVote={onSubmitVote}
          />
        </div>
      )}

      {/* Phase: AI voting (waiting) */}
      {phase === "ai-voting" && (
        <div className="space-y-4">
          {clue && <ClueBanner clue={clue} storytellerName={storytellerName} visible />}
          <ThinkingIndicator
            playerName="AI players"
            action="are voting"
            visible
          />
        </div>
      )}

      {/* Phase: Scoring */}
      {phase === "scoring" && (
        <div className="text-center mt-12">
          <p className="text-zinc-400 animate-pulse">Calculating scores...</p>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && phase !== "ai-storyteller" && phase !== "ai-selecting" && phase !== "ai-voting" && (
        <div className="text-center">
          <p className="text-zinc-500 text-xs animate-pulse">Waiting for AI...</p>
        </div>
      )}
    </div>
  );
}

// Helper to find what card the human submitted in face-up cards
function getHumanSubmittedCard(faceUpCards: { cardId: number; submittedBy: number }[]): number {
  const humanCard = faceUpCards.find((c) => c.submittedBy === 0);
  return humanCard?.cardId ?? -1;
}
