"use client";

import { useState } from "react";
import type { RoundResult, GamePhase, PlayerId } from "@/lib/types";
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

const PLAYER_AVATARS = ["🌙", "🔍", "✒️", "🃏"];

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

function getPlayerSummary(roundResult: RoundResult, playerId: PlayerId, currentPhase: GamePhase): string | null {
  if (!phaseGte(currentPhase, "results")) return null;
  const { storyteller, cardSelections, votes } = roundResult;
  const lines: string[] = [];
  if (storyteller.playerId === playerId) {
    lines.push(`Clue: "${storyteller.clue}"`);
    lines.push(storyteller.reasoning.length > 120
      ? storyteller.reasoning.slice(0, 120) + "…"
      : storyteller.reasoning);
  } else {
    const sel = cardSelections.find((s) => s.playerId === playerId);
    if (sel) lines.push(sel.reasoning.length > 100 ? sel.reasoning.slice(0, 100) + "…" : sel.reasoning);
    const vote = votes.find((v) => v.playerId === playerId);
    if (vote) lines.push(vote.reasoning.length > 100 ? vote.reasoning.slice(0, 100) + "…" : vote.reasoning);
  }
  return lines.join("\n");
}

export function GameBoard({ roundResult, onNewRound }: GameBoardProps) {
  const replay = useGameReplay(roundResult);
  const { currentPhase, advance, isAutoPlaying, setIsAutoPlaying } = replay;
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerId | null>(null);

  const { players, storyteller, faceUpCards, votes, scores } = roundResult;
  const playerNames = players.map((p) => p.name);

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
    <div className="space-y-5">
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

      {/* Compact player row */}
      <div className="flex justify-center gap-6">
        {players.map((player) => {
          const summary = getPlayerSummary(roundResult, player.id, currentPhase);
          return (
            <div
              key={player.id}
              className="relative"
              onMouseEnter={() => setHoveredPlayer(player.id)}
              onMouseLeave={() => setHoveredPlayer(null)}
            >
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border",
                  player.id === storyteller.playerId
                    ? "border-amber-500/50 bg-amber-500/10"
                    : "border-zinc-800 bg-zinc-900/30"
                )}
              >
                <span className="text-base leading-none" title={player.name}>
                  {PLAYER_AVATARS[player.id]}
                </span>
                <span className={cn("text-xs font-medium", PLAYER_COLORS[player.id].text)}>
                  {player.name}
                </span>
                {player.id === storyteller.playerId && (
                  <span className="text-[10px] text-amber-400">★</span>
                )}
                {/* Tiny card backs */}
                <div className="flex gap-0.5 ml-1">
                  {player.hand.map((cardId) => (
                    <div
                      key={cardId}
                      className="w-3 h-4 rounded-sm bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border border-zinc-700/50"
                    />
                  ))}
                </div>
              </div>

              {/* Hover tooltip with AI analysis summary */}
              {hoveredPlayer === player.id && summary && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl text-xs text-zinc-300 whitespace-pre-line pointer-events-none">
                  <div className={cn("font-semibold mb-1", PLAYER_COLORS[player.id].text)}>
                    {player.name}{player.id === storyteller.playerId ? " (Storyteller)" : ""}
                  </div>
                  {summary}
                </div>
              )}
            </div>
          );
        })}
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

      {/* Face-up cards — BIG and prominent */}
      {phaseGte(currentPhase, "cards-revealed") && (
        <div>
          {!phaseGte(currentPhase, "results") && (
            <p className="text-sm text-zinc-500 text-center mb-3">
              Which card did the storyteller play?
            </p>
          )}
          <div className="flex justify-center gap-5">
            {faceUpCards.map((fc) => {
              const isStoryteller = isStorytellerCard(fc.cardId);
              const showResults = phaseGte(currentPhase, "results");
              return (
                <div key={fc.displayIndex} className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">#{fc.displayIndex + 1}</p>
                  <Card
                    cardId={fc.cardId}
                    faceUp
                    size="xl"
                    correct={showResults && isStoryteller ? true : undefined}
                    votes={getVotesForCard(fc.cardId)}
                  />
                  {showResults && (
                    <div className="mt-2">
                      {isStoryteller ? (
                        <span className="inline-block text-xs font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30">
                          ★ {players[fc.submittedBy].name}&apos;s card (Storyteller)
                        </span>
                      ) : (
                        <p className="text-xs text-zinc-500">
                          {players[fc.submittedBy].name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
