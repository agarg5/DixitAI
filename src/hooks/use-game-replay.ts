"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { GamePhase, RoundResult } from "@/lib/types";

const PHASE_ORDER: GamePhase[] = [
  "setup",
  "storyteller-thinking",
  "clue-revealed",
  "selecting-cards",
  "cards-revealed",
  "voting",
  "results",
];

const PHASE_DURATIONS: Record<string, number> = {
  setup: 1500,
  "storyteller-thinking": 2000,
  "clue-revealed": 2500,
  "selecting-cards": 4500,
  "cards-revealed": 2000,
  voting: 4500,
  results: 0, // stays
};

export function useGameReplay(roundResult: RoundResult | null) {
  const [currentPhase, setCurrentPhase] = useState<GamePhase>("setup");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const phaseIndex = PHASE_ORDER.indexOf(currentPhase);
  const isLastPhase = phaseIndex === PHASE_ORDER.length - 1;

  const advance = useCallback(() => {
    setCurrentPhase((prev) => {
      const idx = PHASE_ORDER.indexOf(prev);
      if (idx < PHASE_ORDER.length - 1) {
        return PHASE_ORDER[idx + 1];
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setCurrentPhase("setup");
    setIsAutoPlaying(true);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!roundResult || !isAutoPlaying || isLastPhase) return;

    const duration = PHASE_DURATIONS[currentPhase] || 2000;
    timerRef.current = setTimeout(advance, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roundResult, currentPhase, isAutoPlaying, isLastPhase, advance]);

  return {
    currentPhase,
    advance,
    reset,
    isAutoPlaying,
    setIsAutoPlaying,
    isLastPhase,
    phaseIndex,
    totalPhases: PHASE_ORDER.length,
  };
}
