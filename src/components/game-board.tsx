"use client";

import type { RoundResult, GamePhase } from "@/lib/types";
import { useGameReplay } from "@/hooks/use-game-replay";
import { Card } from "./card";
import { ClueBanner } from "./clue-banner";
import { PhaseStepper } from "./phase-stepper";
import { Scoreboard } from "./scoreboard";
import { ThinkingIndicator } from "./thinking-indicator";
import { ReasoningPanel } from "./reasoning-panel";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = [
  { bg: "bg-blue-500", text: "text-blue-400" },
  { bg: "bg-emerald-500", text: "text-emerald-400" },
  { bg: "bg-purple-500", text: "text-purple-400" },
  { bg: "bg-rose-500", text: "text-rose-400" },
];

interface GameBoardProps {
  roundResult: RoundResult;
  onNewRound: () => void;
}

function phaseGte(current: GamePhase, target: GamePhase): boolean {
  const order: GamePhase[] = [
    "setup", "storyteller-thinking", "clue-revealed",
    "selecting-cards", "cards-revealed", "voting", "results",
  ];
  return order.indexOf(current) >= order.indexOf(target);
}

export function GameBoard({ roundResult, onNewRound }: GameBoardProps) {
  const replay = useGameReplay(roundResult);
  const { currentPhase, advance, isAutoPlaying, setIsAutoPlaying } = replay;

  const { players, storyteller, faceUpCards, votes, scores } = roundResult;
  const playerNames = players.map((p) => p.name);

  // Build vote display data for face-up cards
  const getVotesForCard = (cardId: number) => {
    if (!phaseGte(currentPhase, "voting")) return [];
    return votes
      .filter((v) => v.votedCard === cardId)
      .map((v) => ({
        playerName: players[v.playerId].name,
        color: PLAYER_COLORS[v.playerId].bg,
      }));
  };

  const isStorytellerCard = (cardId: number) =>
    cardId === storyteller.chosenCard;

  return (
    <div className="space-y-6">
      {/* Phase stepper */}
      <PhaseStepper currentPhase={currentPhase} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          {isAutoPlaying ? "Pause" : "Auto-play"}
        </button>
        {!isAutoPlaying && !replay.isLastPhase && (
          <button
            onClick={advance}
            className="px-3 py-1 text-xs rounded bg-amber-600 text-white hover:bg-amber-500 transition-colors"
          >
            Next Step
          </button>
        )}
        {replay.isLastPhase && (
          <button
            onClick={onNewRound}
            className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            New Round
          </button>
        )}
      </div>

      {/* Player seats */}
      <div className="grid grid-cols-4 gap-4">
        {players.map((player) => (
          <div
            key={player.id}
            className={cn(
              "rounded-lg p-3 transition-all duration-300 border",
              player.id === storyteller.playerId
                ? "border-amber-500/50 bg-amber-500/5"
                : "border-zinc-800 bg-zinc-900/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={cn(
                  "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white",
                  PLAYER_COLORS[player.id].bg
                )}
              >
                {player.name[0]}
              </span>
              <span className={cn("text-sm font-medium", PLAYER_COLORS[player.id].text)}>
                {player.name}
              </span>
              {player.id === storyteller.playerId && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  Storyteller
                </span>
              )}
            </div>

            {/* Player's hand — face down */}
            {phaseGte(currentPhase, "setup") && (
              <div className="flex gap-1 flex-wrap">
                {player.hand.map((cardId) => (
                  <Card
                    key={cardId}
                    cardId={cardId}
                    faceUp={false}
                    size="sm"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Thinking indicators */}
      {currentPhase === "storyteller-thinking" && (
        <ThinkingIndicator
          playerName={players[storyteller.playerId].name}
          action="is thinking of a clue"
          visible
        />
      )}
      {currentPhase === "selecting-cards" && (
        <ThinkingIndicator
          playerName="Other players"
          action="are selecting cards"
          visible
        />
      )}
      {currentPhase === "voting" && (
        <ThinkingIndicator
          playerName="Players"
          action="are voting"
          visible
        />
      )}

      {/* Clue banner */}
      {phaseGte(currentPhase, "clue-revealed") && (
        <ClueBanner
          clue={storyteller.clue}
          storytellerName={players[storyteller.playerId].name}
          visible={phaseGte(currentPhase, "clue-revealed")}
        />
      )}

      {/* Face-up cards */}
      {phaseGte(currentPhase, "cards-revealed") && (
        <div>
          <p className="text-sm text-zinc-500 text-center mb-3">
            {phaseGte(currentPhase, "results")
              ? "The storyteller's card is highlighted in gold"
              : "Which card did the storyteller play?"}
          </p>
          <div className="flex justify-center gap-4">
            {faceUpCards.map((fc) => (
              <div key={fc.displayIndex} className="text-center">
                <p className="text-xs text-zinc-500 mb-1">#{fc.displayIndex + 1}</p>
                <Card
                  cardId={fc.cardId}
                  faceUp
                  size="lg"
                  correct={phaseGte(currentPhase, "results") && isStorytellerCard(fc.cardId) ? true : undefined}
                  votes={getVotesForCard(fc.cardId)}
                />
                {phaseGte(currentPhase, "results") && (
                  <p className="text-xs text-zinc-500 mt-1">
                    {players[fc.submittedBy].name}
                    {isStorytellerCard(fc.cardId) && " ★"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoreboard */}
      {phaseGte(currentPhase, "results") && (
        <Scoreboard scores={scores} playerNames={playerNames} visible />
      )}

      {/* AI Reasoning panel */}
      {phaseGte(currentPhase, "results") && (
        <ReasoningPanel roundResult={roundResult} />
      )}
    </div>
  );
}
