"use client";

import { cn } from "@/lib/utils";

interface ThinkingIndicatorProps {
  playerName: string;
  action: string;
  visible: boolean;
}

export function ThinkingIndicator({ playerName, action, visible }: ThinkingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 justify-center text-sm text-zinc-400 transition-all duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <span className="font-medium text-zinc-300">{playerName}</span>
      <span>{action}</span>
      <span className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}
