import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  CardId,
  PlayerId,
  StorytellerResult,
  CardSelectionResult,
  VoteResult,
  FaceUpCard,
} from "./types";
import { buildImageContent } from "./image-utils";
import {
  STORYTELLER_SYSTEM,
  CARD_SELECTOR_SYSTEM,
  VOTER_SYSTEM,
} from "./prompts";

// Single model — temperature is passed per-call for diversity
const model = openai("gpt-4o");

// Temperature per role to create diversity
// Storyteller: high temp = more creative, surprising clues
// Selectors/Voters: varied temps = different interpretation styles
const STORYTELLER_TEMP = 1.2;
const SELECTOR_TEMPS = [0.6, 0.9, 1.1]; // analytical, balanced, creative
const VOTER_TEMPS = [0.5, 0.8, 1.0];    // careful, moderate, intuitive

// Subtle interpretation biases per player (appended to system prompts)
const PLAYER_BIASES = [
  "", // Player 0 is storyteller
  "\n\nYour interpretation style: You tend to focus on the literal visual elements and direct symbolism in images.",
  "\n\nYour interpretation style: You tend to focus on the emotional mood and atmosphere of images rather than specific objects.",
  "\n\nYour interpretation style: You tend to make unusual, lateral connections — thinking of idioms, cultural references, and wordplay.",
];

function getSelectorTemp(playerId: PlayerId) {
  return SELECTOR_TEMPS[playerId - 1] ?? SELECTOR_TEMPS[0];
}

function getVoterTemp(playerId: PlayerId) {
  return VOTER_TEMPS[playerId - 1] ?? VOTER_TEMPS[0];
}

function getPlayerBias(playerId: PlayerId) {
  return PLAYER_BIASES[playerId] || "";
}

export async function storytellerPickCard(
  playerId: PlayerId,
  hand: CardId[]
): Promise<StorytellerResult> {
  try {
    // Step 1: Pick card and draft initial clue
    const { output: draft } = await generateText({
      model,
      temperature: STORYTELLER_TEMP,
      output: Output.object({
        schema: z.object({
          chosenCardIndex: z.number().int().min(0).max(5),
          clue: z.string(),
          reasoning: z.string(),
        }),
      }),
      messages: [
        { role: "system", content: STORYTELLER_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: "Here are your 6 cards. Choose one and give a clue:" },
            ...buildImageContent(hand),
          ],
        },
      ],
    });

    if (!draft) throw new Error("No draft from storyteller");

    // Step 2: Self-critique and refine the clue
    const { output: refined } = await generateText({
      model,
      temperature: STORYTELLER_TEMP,
      output: Output.object({
        schema: z.object({
          refinedClue: z.string().describe("The improved clue"),
          reasoning: z.string(),
        }),
      }),
      messages: [
        {
          role: "system",
          content: `You are a Dixit clue critic. A storyteller drafted a clue for their card. Your job is to make the clue HARDER to guess while still being connected to the card.

The original clue was: "${draft.clue}"

Evaluate: if someone saw this card, would the clue be obviously connected? If YES, the clue is too easy and needs to be more oblique.

Rules for refinement:
- Make the connection more INDIRECT — use a personal memory, cultural reference, pun, or emotional tangent
- The clue should make someone go "oh, I see it NOW" after the reveal, not "obviously that one"
- Shorten to 2-4 words if possible — shorter clues are harder to decode
- Use a completely different ANGLE than the draft if the draft is too literal
- Try: a movie/book/song title, a date, a name, a single emotion, an unrelated-seeming phrase with a hidden link`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Here is the card the storyteller chose (Card ${draft.chosenCardIndex}):` },
            ...buildImageContent([hand[draft.chosenCardIndex]]),
            { type: "text", text: `\nThe draft clue was: "${draft.clue}"\n\nPlease provide a more challenging refined clue.` },
          ],
        },
      ],
    });

    const idx = Math.min(Math.max(0, draft.chosenCardIndex), hand.length - 1);
    const finalClue = (refined?.refinedClue || draft.clue).replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, '');

    return {
      playerId,
      chosenCard: hand[idx],
      clue: finalClue,
      reasoning: `Draft: "${draft.clue}" → Refined: "${finalClue}". ${refined?.reasoning || draft.reasoning}`,
    };
  } catch (error) {
    console.error("Storyteller AI error, using fallback:", error);
    const idx = Math.floor(Math.random() * hand.length);
    return {
      playerId,
      chosenCard: hand[idx],
      clue: "A mysterious journey",
      reasoning: "[AI error — random selection with fallback clue]",
    };
  }
}

export async function selectCard(
  playerId: PlayerId,
  hand: CardId[],
  clue: string
): Promise<CardSelectionResult> {
  try {
    const { output } = await generateText({
      model,
      temperature: getSelectorTemp(playerId),
      output: Output.object({
        schema: z.object({
          chosenCardIndex: z
            .number()
            .int()
            .min(0)
            .max(5)
            .describe("Index of the chosen card (0-5)"),
          reasoning: z
            .string()
            .describe("Why this card best matches the clue"),
        }),
      }),
      messages: [
        { role: "system", content: CARD_SELECTOR_SYSTEM + getPlayerBias(playerId) },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The storyteller's clue is: "${clue}"\n\nHere are your 6 cards. Pick the one that best matches:`,
            },
            ...buildImageContent(hand),
          ],
        },
      ],
    });

    if (!output) throw new Error("No output from card selector");

    const idx = Math.min(Math.max(0, output.chosenCardIndex), hand.length - 1);
    return {
      playerId,
      chosenCard: hand[idx],
      reasoning: output.reasoning,
    };
  } catch (error) {
    console.error(`Card selection AI error for player ${playerId}:`, error);
    const idx = Math.floor(Math.random() * hand.length);
    return {
      playerId,
      chosenCard: hand[idx],
      reasoning: "[AI error — random selection]",
    };
  }
}

export async function voteForCard(
  playerId: PlayerId,
  faceUpCards: FaceUpCard[],
  ownCardId: CardId,
  clue: string
): Promise<VoteResult> {
  const ownPosition = faceUpCards.findIndex((c) => c.cardId === ownCardId);
  const cardIds = faceUpCards.map((c) => c.cardId);

  try {
    const { output } = await generateText({
      model,
      temperature: getVoterTemp(playerId),
      output: Output.object({
        schema: z.object({
          votedCardIndex: z
            .number()
            .int()
            .min(0)
            .max(3)
            .describe("Index of the card you vote for (0-3)"),
          reasoning: z
            .string()
            .describe("Why you think this is the storyteller's card"),
        }),
      }),
      messages: [
        { role: "system", content: VOTER_SYSTEM + getPlayerBias(playerId) },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `The storyteller's clue is: "${clue}"\n\nYour card is at position ${ownPosition} — you CANNOT vote for it.\n\n4 cards are displayed:`,
            },
            ...buildImageContent(cardIds),
          ],
        },
      ],
    });

    if (!output) throw new Error("No output from voter");

    let votedIdx = output.votedCardIndex;

    // Ensure they didn't vote for their own card
    if (votedIdx === ownPosition) {
      const validIndices = faceUpCards
        .map((_, i) => i)
        .filter((i) => i !== ownPosition);
      votedIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
    }

    votedIdx = Math.min(Math.max(0, votedIdx), faceUpCards.length - 1);

    return {
      playerId,
      votedCard: faceUpCards[votedIdx].cardId,
      reasoning: output.reasoning,
    };
  } catch (error) {
    console.error(`Voting AI error for player ${playerId}:`, error);
    const validCards = faceUpCards.filter((c) => c.cardId !== ownCardId);
    const pick = validCards[Math.floor(Math.random() * validCards.length)];
    return {
      playerId,
      votedCard: pick.cardId,
      reasoning: "[AI error — random vote]",
    };
  }
}
