"use client";

import { useState } from "react";
import type { CardId } from "@/lib/types";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface ClueInputProps {
  hand: CardId[];
  onSubmit: (chosenCard: CardId, clue: string) => void;
}

export function ClueInput({ hand, onSubmit }: ClueInputProps) {
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);
  const [clue, setClue] = useState("");

  const canSubmit = selectedCard !== null && clue.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-amber-400">
          You are the Storyteller!
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Pick a card from your hand and write a clue for it.
          Make it tricky — not too obvious, not too obscure.
        </p>
      </div>

      {/* Card selection */}
      <div className="flex justify-center gap-3 flex-wrap">
        {hand.map((cardId) => (
          <div
            key={cardId}
            className={cn(
              "transition-transform duration-200 hover:-translate-y-2",
              selectedCard === cardId && "-translate-y-3"
            )}
          >
            <Card
              cardId={cardId}
              faceUp
              size="lg"
              selected={selectedCard === cardId}
              onClick={() =>
                setSelectedCard(selectedCard === cardId ? null : cardId)
              }
            />
          </div>
        ))}
      </div>

      {/* Clue input */}
      {selectedCard !== null && (
        <div className="max-w-md mx-auto space-y-3">
          <input
            type="text"
            value={clue}
            onChange={(e) => setClue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit) {
                onSubmit(selectedCard, clue.trim());
              }
            }}
            placeholder="Enter your clue..."
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            autoFocus
          />
          <div className="flex justify-center">
            <button
              onClick={() => canSubmit && onSubmit(selectedCard, clue.trim())}
              disabled={!canSubmit}
              className={cn(
                "px-6 py-2 rounded-lg font-semibold transition-colors",
                canSubmit
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              )}
            >
              Submit Clue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
