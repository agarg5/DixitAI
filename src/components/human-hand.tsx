"use client";

import { useState } from "react";
import type { CardId } from "@/lib/types";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface HumanHandProps {
  hand: CardId[];
  onSelect: (cardId: CardId) => void;
  prompt: string;
  disabled?: boolean;
}

export function HumanHand({ hand, onSelect, prompt, disabled }: HumanHandProps) {
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-300 text-center">{prompt}</p>
      <div className="flex justify-center gap-3 flex-wrap">
        {hand.map((cardId) => (
          <div
            key={cardId}
            className={cn(
              "transition-transform duration-200",
              !disabled && "hover:-translate-y-2",
              selectedCard === cardId && "-translate-y-3"
            )}
          >
            <Card
              cardId={cardId}
              faceUp
              size="lg"
              selected={selectedCard === cardId}
              onClick={
                disabled
                  ? undefined
                  : () => setSelectedCard(selectedCard === cardId ? null : cardId)
              }
            />
          </div>
        ))}
      </div>
      {selectedCard !== null && !disabled && (
        <div className="flex justify-center">
          <button
            onClick={() => onSelect(selectedCard)}
            className="px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      )}
    </div>
  );
}
