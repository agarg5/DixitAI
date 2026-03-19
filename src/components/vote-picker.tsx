"use client";

import { useState } from "react";
import type { CardId, FaceUpCard } from "@/lib/types";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface VotePickerProps {
  faceUpCards: FaceUpCard[];
  ownCardId: CardId;
  clue: string;
  onVote: (votedCard: CardId) => void;
}

export function VotePicker({
  faceUpCards,
  ownCardId,
  clue,
  onVote,
}: VotePickerProps) {
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-zinc-400">
          The clue is:{" "}
          <span className="text-amber-400 font-semibold">&ldquo;{clue}&rdquo;</span>
        </p>
        <p className="text-sm text-zinc-500 mt-1">
          Which card do you think the storyteller played? (You can&apos;t vote for your own card.)
        </p>
      </div>

      <div className="flex justify-center gap-5">
        {faceUpCards.map((fc) => {
          const isOwn = fc.cardId === ownCardId;
          return (
            <div key={fc.displayIndex} className="text-center">
              <p className="text-xs text-zinc-500 mb-1">#{fc.displayIndex + 1}</p>
              <div
                className={cn(
                  "transition-transform duration-200",
                  !isOwn && "hover:-translate-y-2",
                  selectedCard === fc.cardId && "-translate-y-3",
                  isOwn && "opacity-50"
                )}
              >
                <Card
                  cardId={fc.cardId}
                  faceUp
                  size="xl"
                  selected={selectedCard === fc.cardId}
                  onClick={isOwn ? undefined : () =>
                    setSelectedCard(
                      selectedCard === fc.cardId ? null : fc.cardId
                    )
                  }
                />
              </div>
              {isOwn && (
                <p className="text-xs text-zinc-600 mt-1">Your card</p>
              )}
            </div>
          );
        })}
      </div>

      {selectedCard !== null && (
        <div className="flex justify-center">
          <button
            onClick={() => onVote(selectedCard)}
            className="px-6 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            Submit Vote
          </button>
        </div>
      )}
    </div>
  );
}
