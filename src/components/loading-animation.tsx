"use client";

import { cn } from "@/lib/utils";

export interface StreamProgress {
  phase: string;
  playerName?: string;
  clue?: string;
  storytellerName?: string;
}

const PLAYER_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];
const PLAYER_NAMES = ["Alice", "Bob", "Carol", "Dave"];

function getPhaseLabel(progress: StreamProgress): string {
  switch (progress.phase) {
    case "setup":
      return "Dealing cards to players...";
    case "storyteller-thinking":
      return `${progress.playerName} (Storyteller) is crafting a clue...`;
    case "clue":
      return `${progress.storytellerName} has given a clue!`;
    case "selecting":
      return `${progress.playerName} is choosing a card...`;
    case "voting":
      return "Players are voting...";
    default:
      return "Thinking...";
  }
}

export function LoadingAnimation({ progress }: { progress: StreamProgress }) {
  const label = getPhaseLabel(progress);

  return (
    <div className="flex flex-col items-center gap-6 mt-8">
      {/* Card table area */}
      <div className="relative w-full max-w-2xl rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden p-6">
        {/* Player seats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {PLAYER_NAMES.map((name, i) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                    PLAYER_COLORS[i]
                  )}
                >
                  {name[0]}
                </span>
                <span className="text-xs text-zinc-400">{name}</span>
                {i === 0 && (
                  <span className="text-[10px] text-amber-400">★</span>
                )}
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div
                    key={j}
                    className={cn(
                      "w-7 h-10 rounded bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border border-zinc-700",
                      progress.phase === "selecting" && progress.playerName === name && "animate-pulse border-amber-500/50"
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Clue display */}
        {progress.clue && (
          <div className="text-center py-4 border-t border-zinc-800">
            <p className="text-sm text-zinc-400 mb-1">{progress.storytellerName} says:</p>
            <p className="text-xl font-semibold text-amber-300 italic">
              &ldquo;{progress.clue}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-300 text-sm">{label}</p>
        </div>
        <p className="text-zinc-600 text-xs">This usually takes 30-60 seconds</p>
      </div>
    </div>
  );
}
