"use client";

import type { PlayerScore } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];

interface ScoreboardProps {
  scores: PlayerScore[];
  playerNames: string[];
  visible: boolean;
}

export function Scoreboard({ scores, playerNames, visible }: ScoreboardProps) {
  const sorted = [...scores].sort((a, b) => b.points - a.points);

  return (
    <div
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      <h3 className="text-lg font-semibold text-zinc-200 mb-3 text-center">Scores</h3>
      <div className="space-y-2 max-w-md mx-auto">
        {sorted.map((score, rank) => (
          <div
            key={score.playerId}
            className="flex items-center gap-3 bg-zinc-800/50 rounded-lg px-4 py-2"
          >
            <span className="text-zinc-500 font-mono text-sm w-4">
              {rank + 1}.
            </span>
            <span
              className={cn(
                "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white",
                PLAYER_COLORS[score.playerId]
              )}
            >
              {playerNames[score.playerId][0]}
            </span>
            <span className="text-zinc-200 font-medium flex-1">
              {playerNames[score.playerId]}
            </span>
            <span className="text-amber-400 font-bold text-lg">
              {score.points}
            </span>
            <span className="text-xs text-zinc-500">
              {score.breakdown.storytellerBonus > 0 && `ST:${score.breakdown.storytellerBonus} `}
              {score.breakdown.correctVote > 0 && `CV:${score.breakdown.correctVote} `}
              {score.breakdown.allOrNoneBonus > 0 && `B:${score.breakdown.allOrNoneBonus} `}
              {score.breakdown.receivedVotes > 0 && `RV:${score.breakdown.receivedVotes}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
