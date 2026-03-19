"use client";

import { useState } from "react";
import type { RoundResult } from "@/lib/types";
import { GameBoard } from "@/components/game-board";

export default function Home() {
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startNewRound() {
    setLoading(true);
    setError(null);
    setRoundResult(null);

    try {
      const res = await fetch("/api/game/round", { method: "POST" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: RoundResult = await res.json();
      setRoundResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 flex-1">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Dixit <span className="text-amber-400">AI</span>
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Watch 4 AI players compete in the card game Dixit
        </p>
      </header>

      {!roundResult && !loading && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <p className="text-zinc-500 text-sm">
            Start a round to watch AI players play Dixit against each other.
          </p>
          <button
            onClick={startNewRound}
            className="px-6 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors text-lg"
          >
            New Game
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-4 mt-16">
          <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">
            Running the round... AI players are thinking (this takes 30-60 seconds)
          </p>
        </div>
      )}

      {error && (
        <div className="text-center mt-16">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={startNewRound}
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {roundResult && (
        <GameBoard roundResult={roundResult} onNewRound={startNewRound} />
      )}
    </main>
  );
}
