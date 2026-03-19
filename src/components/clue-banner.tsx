"use client";

import { cn } from "@/lib/utils";

interface ClueBannerProps {
  clue: string;
  storytellerName: string;
  visible: boolean;
}

export function ClueBanner({ clue, storytellerName, visible }: ClueBannerProps) {
  return (
    <div
      className={cn(
        "text-center transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}
    >
      <p className="text-sm text-zinc-400 mb-1">{storytellerName} says:</p>
      <p className="text-2xl font-semibold text-amber-300 italic">
        &ldquo;{clue}&rdquo;
      </p>
    </div>
  );
}
