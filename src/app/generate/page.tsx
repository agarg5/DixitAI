"use client";

import { useState } from "react";
import { Sparkles, Wand2, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    imageUrl: string;
    prompt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(mode: "custom" | "random") {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: mode === "custom" ? prompt : "",
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  function downloadImage() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = `dixit-card-${Date.now()}.png`;
    link.click();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex-1">
      <header className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to game
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
          Card <span className="text-amber-400">Studio</span>
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Generate surreal Dixit-style card art with AI
        </p>
      </header>

      {/* Prompt input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your card... e.g. &quot;a whale swimming through clouds above a sleeping city&quot;"
            className="w-full h-28 px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none transition-colors"
            disabled={generating}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => generate("custom")}
            disabled={generating || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => generate("random")}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-700 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Surprise me
          </button>
        </div>
      </div>

      {/* Loading state */}
      {generating && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-72 h-[432px] rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <p className="text-zinc-500 text-sm animate-pulse">
            Painting your card...
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-8 text-center">
          <p className="text-red-400 mb-3 text-sm">{error}</p>
          <button
            onClick={() => generate(prompt.trim() ? "custom" : "random")}
            className="px-4 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-72 h-[432px] rounded-xl overflow-hidden border-2 border-zinc-700 shadow-2xl shadow-amber-500/10">
            <img
              src={result.imageUrl}
              alt={result.prompt}
              className="w-full h-full object-cover"
            />
          </div>

          <p className="text-zinc-400 text-sm text-center italic max-w-md">
            &ldquo;{result.prompt}&rdquo;
          </p>

          <div className="flex gap-3">
            <button
              onClick={downloadImage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => {
                setResult(null);
                setPrompt("");
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              New card
            </button>
          </div>
        </div>
      )}

      {/* Example gallery hint */}
      {!generating && !result && !error && (
        <div className="mt-16 text-center">
          <p className="text-zinc-600 text-xs">
            Tip: Try evocative, poetic descriptions. Think metaphors, dreams, and impossible scenes.
          </p>
        </div>
      )}
    </main>
  );
}
