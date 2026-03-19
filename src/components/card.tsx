"use client";

import { getCardUrl } from "@/lib/cards";
import type { CardId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardProps {
  cardId: CardId;
  faceUp?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  correct?: boolean;
  incorrect?: boolean;
  size?: "sm" | "md" | "lg";
  votes?: { playerName: string; color: string }[];
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-20 h-[120px]",
  md: "w-28 h-[168px]",
  lg: "w-36 h-[216px]",
};

export function Card({
  cardId,
  faceUp = false,
  selected = false,
  highlighted = false,
  correct,
  incorrect,
  size = "md",
  votes = [],
  onClick,
}: CardProps) {
  return (
    <div className={cn("relative", onClick && "cursor-pointer")} onClick={onClick}>
      <div
        className={cn(
          sizeClasses[size],
          "rounded-lg overflow-hidden transition-all duration-500 transform-gpu",
          "border-2",
          selected && "border-amber-400 shadow-lg shadow-amber-400/30",
          highlighted && "border-blue-400 shadow-lg shadow-blue-400/30",
          correct === true && "border-emerald-400 shadow-lg shadow-emerald-400/30",
          incorrect === true && "border-red-400 shadow-lg shadow-red-400/30",
          !selected && !highlighted && correct === undefined && incorrect === undefined && "border-zinc-700",
          faceUp ? "rotate-y-0" : "rotate-y-180"
        )}
        style={{ perspective: "600px" }}
      >
        {faceUp ? (
          <img
            src={getCardUrl(cardId)}
            alt={`Card ${cardId}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 flex items-center justify-center">
            <div className="text-2xl opacity-40">🂠</div>
          </div>
        )}
      </div>

      {/* Vote markers */}
      {votes.length > 0 && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {votes.map((v, i) => (
            <span
              key={i}
              className={cn(
                "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white",
                v.color
              )}
              title={v.playerName}
            >
              {v.playerName[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
