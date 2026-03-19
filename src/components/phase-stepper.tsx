"use client";

import { cn } from "@/lib/utils";
import type { GamePhase } from "@/lib/types";

const PHASE_LABELS: Record<string, string> = {
  setup: "Setup",
  "storyteller-thinking": "Storyteller",
  "clue-revealed": "Clue",
  "selecting-cards": "Card Selection",
  "cards-revealed": "Reveal",
  voting: "Voting",
  results: "Results",
};

const PHASES: GamePhase[] = [
  "setup",
  "storyteller-thinking",
  "clue-revealed",
  "selecting-cards",
  "cards-revealed",
  "voting",
  "results",
];

interface PhaseStepperProps {
  currentPhase: GamePhase;
}

export function PhaseStepper({ currentPhase }: PhaseStepperProps) {
  const currentIdx = PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1 justify-center">
      {PHASES.map((phase, i) => (
        <div key={phase} className="flex items-center">
          <div
            className={cn(
              "px-2 py-1 rounded text-xs font-medium transition-all duration-300",
              i < currentIdx && "bg-zinc-700 text-zinc-300",
              i === currentIdx && "bg-amber-500 text-black",
              i > currentIdx && "bg-zinc-800 text-zinc-600"
            )}
          >
            {PHASE_LABELS[phase]}
          </div>
          {i < PHASES.length - 1 && (
            <div
              className={cn(
                "w-4 h-px mx-0.5",
                i < currentIdx ? "bg-zinc-600" : "bg-zinc-800"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
