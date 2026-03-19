"use client";

export interface StreamProgress {
  phase: string;
  playerName?: string;
  clue?: string;
  storytellerName?: string;
}

function getPhaseLabel(progress: StreamProgress): string {
  switch (progress.phase) {
    case "setup":
      return "Shuffling and dealing cards...";
    case "storyteller-thinking":
      return "The storyteller is crafting a clue...";
    case "clue":
      return "Players are choosing cards to match the clue...";
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
    <div className="flex flex-col items-center gap-6 mt-16">
      {/* Clue display — the main thing to show */}
      {progress.clue && (
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-2">The storyteller says:</p>
          <p className="text-2xl font-semibold text-amber-300 italic">
            &ldquo;{progress.clue}&rdquo;
          </p>
        </div>
      )}

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
