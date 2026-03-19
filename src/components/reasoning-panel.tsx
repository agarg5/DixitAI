"use client";

import { useState } from "react";
import type { RoundResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = ["text-blue-400", "text-emerald-400", "text-purple-400", "text-rose-400"];

interface ReasoningPanelProps {
  roundResult: RoundResult;
}

export function ReasoningPanel({ roundResult }: ReasoningPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const { storyteller, cardSelections, votes, players } = roundResult;

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left text-sm font-medium text-zinc-300 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors flex items-center justify-between"
      >
        <span>AI Reasoning</span>
        <span className={cn("transition-transform", expanded && "rotate-180")}>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-4 py-3 space-y-4 text-sm">
          {/* Storyteller reasoning */}
          <div>
            <h4 className={cn("font-semibold mb-1", PLAYER_COLORS[storyteller.playerId])}>
              {players[storyteller.playerId].name} (Storyteller)
            </h4>
            <p className="text-zinc-400">{storyteller.reasoning}</p>
          </div>

          {/* Card selection reasoning */}
          {cardSelections.map((sel) => (
            <div key={sel.playerId}>
              <h4 className={cn("font-semibold mb-1", PLAYER_COLORS[sel.playerId])}>
                {players[sel.playerId].name} (Card Selection)
              </h4>
              <p className="text-zinc-400">{sel.reasoning}</p>
            </div>
          ))}

          {/* Voting reasoning */}
          {votes.map((vote) => (
            <div key={`vote-${vote.playerId}`}>
              <h4 className={cn("font-semibold mb-1", PLAYER_COLORS[vote.playerId])}>
                {players[vote.playerId].name} (Vote)
              </h4>
              <p className="text-zinc-400">{vote.reasoning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
