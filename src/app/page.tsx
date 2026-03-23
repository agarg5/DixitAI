"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { GameMode, RoundResult } from "@/lib/types";
import { GameBoard } from "@/components/game-board";
import { LoadingAnimation, type StreamProgress } from "@/components/loading-animation";
import { useHumanRound } from "@/hooks/use-human-round";
import { HumanRoundView } from "@/components/human-round-view";
import { Card } from "@/components/card";
import { TOTAL_CARDS } from "@/lib/cards";
import { cn } from "@/lib/utils";

// Pick random card IDs for the decorative display
function pickRandomCards(count: number): number[] {
  const ids = Array.from({ length: TOTAL_CARDS }, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}

export default function Home() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const [decorativeCards, setDecorativeCards] = useState<number[]>([]);
  useEffect(() => { setDecorativeCards(pickRandomCards(6)); }, []);

  // Spectator mode state
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<StreamProgress>({ phase: "setup" });
  const abortRef = useRef<AbortController | null>(null);

  // Human player mode
  const humanRound = useHumanRound();

  function goHome() {
    setMode(null);
    setShowRoleChoice(false);
    setRoundResult(null);
    setLoading(false);
    setError(null);
  }

  function startHumanRound(preference: "storyteller" | "participant" | "random") {
    setShowRoleChoice(false);
    setMode("human-player");
    humanRound.startRound(preference);
  }

  async function startSpectatorRound() {
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
        <h1
          className="text-4xl font-bold tracking-tight text-zinc-100 cursor-pointer"
          onClick={goHome}
        >
          Dixit <span className="text-amber-400">AI</span>
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {mode === "human-player"
            ? "Play Dixit against 3 AI opponents"
            : mode === "spectator"
              ? "Watch 4 AI players compete in Dixit"
              : "The AI card game"}
        </p>
      </header>

      {/* Mode selector */}
      {!mode && !showRoleChoice && (
        <div className="flex flex-col items-center gap-6 mt-8">
          {/* How it works */}
          <div className="flex gap-6 text-center text-xs text-zinc-500 max-w-lg">
            <div>
              <span className="text-amber-400 font-semibold block mb-0.5">1. Deal</span>
              Each player gets 6 surreal art cards
            </div>
            <div>
              <span className="text-amber-400 font-semibold block mb-0.5">2. Clue</span>
              The storyteller picks a card and gives a cryptic clue
            </div>
            <div>
              <span className="text-amber-400 font-semibold block mb-0.5">3. Guess</span>
              Everyone plays a card &mdash; then votes on which is the storyteller&apos;s
            </div>
          </div>

          <p className="text-zinc-500 text-sm">Choose how you want to play</p>
          <div className="flex gap-4">
            <button
              onClick={() => setShowRoleChoice(true)}
              className={cn(
                "px-8 py-6 rounded-xl border-2 transition-all text-left max-w-xs",
                "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10"
              )}
            >
              <div className="text-lg font-semibold text-amber-400 mb-1">
                Play with AIs
              </div>
              <p className="text-xs text-zinc-500">
                Pick cards, write clues, and vote against 3 AI opponents.
              </p>
            </button>
            <button
              onClick={() => {
                setMode("spectator");
                startSpectatorRound();
              }}
              className={cn(
                "px-8 py-6 rounded-xl border-2 transition-all text-left max-w-xs",
                "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50"
              )}
            >
              <div className="text-lg font-semibold text-zinc-300 mb-1">
                Watch AI Play
              </div>
              <p className="text-xs text-zinc-500">
                Sit back and watch 4 AI players compete against each other.
              </p>
            </button>
          </div>

          {/* Decorative Dixit cards */}
          <div className="mt-10 flex justify-center gap-4">
            {decorativeCards.map((cardId) => (
              <Card key={cardId} cardId={cardId} faceUp size="lg" />
            ))}
          </div>

          {/* Card Studio link */}
          <Link
            href="/generate"
            className={cn(
              "mt-8 flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all",
              "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60 hover:bg-purple-500/10"
            )}
          >
            <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="text-left">
              <div className="text-sm font-semibold text-purple-400">
                Card Studio
              </div>
              <p className="text-xs text-zinc-500">
                Generate your own surreal Dixit-style cards with AI.
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Role choice (after clicking Play with AIs) */}
      {!mode && showRoleChoice && (
        <div className="flex flex-col items-center gap-6 mt-8">
          <p className="text-zinc-400 text-sm">What role do you want?</p>
          <div className="flex gap-3">
            <button
              onClick={() => startHumanRound("storyteller")}
              className={cn(
                "px-6 py-5 rounded-xl border-2 transition-all text-left max-w-[200px]",
                "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/10"
              )}
            >
              <div className="text-sm font-semibold text-amber-400 mb-1">
                Storyteller
              </div>
              <p className="text-xs text-zinc-500">
                Pick a card and write a clue for the AIs to guess.
              </p>
            </button>
            <button
              onClick={() => startHumanRound("participant")}
              className={cn(
                "px-6 py-5 rounded-xl border-2 transition-all text-left max-w-[200px]",
                "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:bg-blue-500/10"
              )}
            >
              <div className="text-sm font-semibold text-blue-400 mb-1">
                Participant
              </div>
              <p className="text-xs text-zinc-500">
                An AI gives the clue. You pick cards and vote.
              </p>
            </button>
            <button
              onClick={() => startHumanRound("random")}
              className={cn(
                "px-6 py-5 rounded-xl border-2 transition-all text-left max-w-[200px]",
                "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50"
              )}
            >
              <div className="text-sm font-semibold text-zinc-300 mb-1">
                Surprise Me
              </div>
              <p className="text-xs text-zinc-500">
                Randomly assigned as storyteller or participant.
              </p>
            </button>
          </div>
          <button
            onClick={() => setShowRoleChoice(false)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {/* Spectator mode */}
      {mode === "spectator" && (
        <>
          {loading && <LoadingAnimation progress={progress} />}

          {error && (
            <div className="text-center mt-16">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={startSpectatorRound}
                className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {roundResult && (
            <GameBoard roundResult={roundResult} onNewRound={startSpectatorRound} />
          )}
        </>
      )}

      {/* Human player mode */}
      {mode === "human-player" && (
        <HumanRoundView
          state={humanRound.state}
          onSubmitStorytellerChoice={humanRound.submitStorytellerChoice}
          onSubmitCardSelection={humanRound.submitCardSelection}
          onSubmitVote={humanRound.submitVote}
          onNewRound={humanRound.startRound}
        />
      )}
    </main>
  );
}
