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

const model = openai("gpt-4o");

export async function storytellerPickCard(
  playerId: PlayerId,
  hand: CardId[]
): Promise<StorytellerResult> {
  try {
    const { output } = await generateText({
      model,
      output: Output.object({
        schema: z.object({
          chosenCardIndex: z
            .number()
            .int()
            .min(0)
            .max(5)
            .describe("Index of the chosen card (0-5)"),
          clue: z
            .string()
            .describe("The clue phrase for other players"),
          reasoning: z
            .string()
            .describe("Why you chose this card and clue"),
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

    if (!output) throw new Error("No output from storyteller");

    const idx = Math.min(Math.max(0, output.chosenCardIndex), hand.length - 1);
    return {
      playerId,
      chosenCard: hand[idx],
      clue: output.clue,
      reasoning: output.reasoning,
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
        { role: "system", content: CARD_SELECTOR_SYSTEM },
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
        { role: "system", content: VOTER_SYSTEM },
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
      // Pick the next valid index
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
