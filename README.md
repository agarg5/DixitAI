# Dixit AI

An AI-powered version of the popular card game [Dixit](https://en.wikipedia.org/wiki/Dixit_(card_game)), where you can play against AI opponents or watch them compete against each other.

https://www.loom.com/share/eed74207fe9c4fe881fe56760dc8f404

[![Watch the demo](https://cdn.loom.com/sessions/thumbnails/eed74207fe9c4fe881fe56760dc8f404-with-play.gif)](https://www.loom.com/share/eed74207fe9c4fe881fe56760dc8f404)

## How It Works

Dixit is a storytelling card game with beautiful, dreamlike artwork. Each round:

1. **The Storyteller** picks a card from their hand and gives a cryptic clue
2. **Other players** each pick a card from their hand that best matches the clue
3. **All submitted cards** are shuffled and revealed face-up
4. **Everyone votes** on which card they think the storyteller played
5. **Scoring** rewards clever clues — too obvious or too obscure and the storyteller gets nothing

The AI players use GPT-4o vision to "see" the card artwork and make their decisions, each with a different personality (analytical, emotional, creative).

## Game Modes

- **Play with AIs** — You are a player alongside 3 AI opponents. Pick cards, write clues, and vote.
- **Watch AI Play** — Sit back and watch 4 AI players compete. Great for seeing how AI interprets visual art.
- **Card Studio** (`/generate`) — Generate your own surreal Dixit-style card art with AI. Type a scene description or hit "Surprise me" for a random prompt. Uses DALL-E 3 for image generation with GPT-4o for creative prompt inspiration.

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key (GPT-4o with vision)

### Setup

```bash
git clone https://github.com/your-username/DixitClaude.git
cd DixitClaude
npm install
```

Create a `.env.local` file with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose your game mode.

## Tech Stack

- **Next.js 16** — App Router, React Server Components
- **AI SDK** + **GPT-4o** — Vision-capable AI for card interpretation
- **shadcn/ui** + **Tailwind CSS v4** — Dark-mode UI with smooth animations
- **80 Dixit card images** — Original artwork rendered as PNGs

## Scoring Rules

| Scenario | Storyteller | Correct Voters | Others |
|----------|------------|----------------|--------|
| All or none found the storyteller's card | 0 pts | — | 2 pts each |
| Some found it | 3 pts | 3 pts each | — |
| **Bonus**: each vote a non-storyteller's card receives | — | — | +1 pt per vote |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page with mode selector
│   ├── generate/page.tsx     # Card Studio — AI image generator
│   └── api/game/
│       ├── round/            # Spectator mode (full AI round)
│       ├── storyteller/      # AI storyteller endpoint
│       ├── select-card/      # AI card selection endpoint
│       └── vote/             # AI vote endpoint
│   └── api/generate/         # Card Studio image generation
├── components/
│   ├── game-board.tsx        # Game replay/display
│   ├── human-round-view.tsx  # Interactive human player UI
│   ├── clue-input.tsx        # Storyteller clue writing
│   ├── vote-picker.tsx       # Card voting interface
│   └── ...                   # Cards, scoreboard, animations
├── hooks/
│   ├── use-game-replay.ts    # Phase-by-phase replay
│   └── use-human-round.ts    # Human player round orchestration
└── lib/
    ├── game-engine.ts        # Pure game logic (deal, shuffle, score)
    ├── ai-player.ts          # AI decision-making with GPT-4o vision
    └── cards.ts              # 80-card manifest
```

## License

MIT
