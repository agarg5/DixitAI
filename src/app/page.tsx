"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { RoundResult } from "@/lib/types";
import { GameBoard } from "@/components/game-board";
import { LoadingAnimation, type StreamProgress } from "@/components/loading-animation";

export default function Home() {
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StreamProgress>({ phase: "setup" });
  const abortRef = useRef<AbortController | null>(null);

  async function startNewRound() {
    setLoading(true);
    setError(null);
    setRoundResult(null);
    setProgress({ phase: "setup" });

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/game/round", {
        method: "POST",
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataMatch = line.match(/^data: (.+)$/m);
          if (!dataMatch) continue;

          try {
            const { event, data } = JSON.parse(dataMatch[1]);

            switch (event) {
              case "setup":
                setProgress({ phase: "setup" });
                break;
              case "phase":
                setProgress((prev) => ({
                  ...prev,
                  phase: data.phase,
                  playerName: data.playerName,
                }));
                break;
              case "clue":
                setProgress((prev) => ({
                  ...prev,
                  phase: "clue",
                  clue: data.clue,
                  storytellerName: data.storytellerName,
                }));
                break;
              case "complete":
                setRoundResult(data as RoundResult);
                break;
              case "error":
                throw new Error(data.message);
            }
          } catch (e) {
            if (e instanceof Error && e.message !== "Failed to run game round") {
              // JSON parse error, skip
            } else {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
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
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs hover:text-amber-400 hover:border-amber-500/30 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Card Studio
        </Link>
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

      {loading && <LoadingAnimation progress={progress} />}

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
