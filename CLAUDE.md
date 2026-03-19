# Dixit AI

AI-vs-AI Dixit card game where 4 AI players (gpt-4o vision) play rounds and a human spectator watches the game unfold step-by-step.

## Tech Stack
- Next.js 16 (App Router, src dir)
- `ai` + `@ai-sdk/openai` (gpt-4o with vision, direct API key)
- shadcn/ui + Tailwind CSS v4 (dark mode)
- No database — stateless single-round API

## Architecture
- **Server-authoritative, precompute-and-replay**: `POST /api/game/round` runs 7 sequential AI calls (~30-60s), returns complete `RoundResult`. Client replays step-by-step with timed phase transitions.
- 80 Dixit card PNGs in `public/cards/`, manifest in `src/lib/cards.ts`
- Game logic (deal, shuffle, score) in `src/lib/game-engine.ts` — pure functions
- AI player logic in `src/lib/ai-player.ts` — storyteller, card selection, voting

## Key Commands
```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
```

## Environment Variables
- `OPENAI_API_KEY` — in `.env.local`, sourced from `~/.zshrc`

## Game Flow (Single Round)
1. Shuffle 80-card deck, deal 6 to each of 4 AI players
2. Storyteller (player 0) sees cards via vision → picks one + generates clue
3. Other 3 AIs see their cards + clue → pick best-matching card
4. 4 submitted cards shuffled, displayed face-up
5. 3 non-storytellers vote (can't vote for own card)
6. Scoring: all/none found = storyteller 0, others 2; partial = storyteller 3, correct voters 3; +1 per received vote

## Future Plans
- Human player support (replace one AI with interactive UI)
- Human-readable card names (batch gpt-4o describe all 80 cards)
- Multi-round game with board tracking
- Vercel deployment (Pro plan for 60s timeout)
