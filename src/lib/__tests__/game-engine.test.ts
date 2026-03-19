import { describe, it, expect } from "vitest";
import {
  buildDeck,
  shuffle,
  dealHands,
  shuffleFaceUpCards,
  calculateScores,
} from "../game-engine";
import type { FaceUpCard, VoteResult, PlayerId } from "../types";

describe("buildDeck", () => {
  it("returns 80 unique card IDs", () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(80);
    expect(new Set(deck).size).toBe(80);
    expect(deck[0]).toBe(0);
    expect(deck[79]).toBe(79);
  });
});

describe("shuffle", () => {
  it("returns same length with same elements", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffle(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3];
    const copy = [...original];
    shuffle(original);
    expect(original).toEqual(copy);
  });
});

describe("dealHands", () => {
  it("deals correct number of hands with correct sizes", () => {
    const deck = buildDeck();
    const { hands, remainingDeck } = dealHands(deck, 4, 6);
    expect(hands).toHaveLength(4);
    hands.forEach((hand) => expect(hand).toHaveLength(6));
    expect(remainingDeck).toHaveLength(80 - 24);
  });

  it("deals no duplicate cards across hands", () => {
    const deck = shuffle(buildDeck());
    const { hands } = dealHands(deck, 4, 6);
    const allCards = hands.flat();
    expect(new Set(allCards).size).toBe(24);
  });
});

describe("shuffleFaceUpCards", () => {
  it("preserves all submissions", () => {
    const submissions = [
      { cardId: 10, submittedBy: 0 as PlayerId },
      { cardId: 20, submittedBy: 1 as PlayerId },
      { cardId: 30, submittedBy: 2 as PlayerId },
      { cardId: 40, submittedBy: 3 as PlayerId },
    ];
    const result = shuffleFaceUpCards(submissions);
    expect(result).toHaveLength(4);
    const cardIds = result.map((r) => r.cardId).sort();
    expect(cardIds).toEqual([10, 20, 30, 40]);
  });

  it("assigns sequential displayIndex values", () => {
    const submissions = [
      { cardId: 1, submittedBy: 0 as PlayerId },
      { cardId: 2, submittedBy: 1 as PlayerId },
    ];
    const result = shuffleFaceUpCards(submissions);
    const indices = result.map((r) => r.displayIndex).sort();
    expect(indices).toEqual([0, 1]);
  });
});

describe("calculateScores", () => {
  const allPlayerIds: PlayerId[] = [0, 1, 2, 3];

  function makeFaceUpCards(storytellerCard: number): FaceUpCard[] {
    return [
      { cardId: storytellerCard, submittedBy: 0, displayIndex: 0 },
      { cardId: 20, submittedBy: 1, displayIndex: 1 },
      { cardId: 30, submittedBy: 2, displayIndex: 2 },
      { cardId: 40, submittedBy: 3, displayIndex: 3 },
    ];
  }

  it("all voters correct: storyteller 0, others 2", () => {
    const faceUp = makeFaceUpCards(10);
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 10, reasoning: "" },
      { playerId: 2, votedCard: 10, reasoning: "" },
      { playerId: 3, votedCard: 10, reasoning: "" },
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    expect(scores.find((s) => s.playerId === 0)!.points).toBe(0);
    expect(scores.find((s) => s.playerId === 1)!.points).toBe(2);
    expect(scores.find((s) => s.playerId === 2)!.points).toBe(2);
    expect(scores.find((s) => s.playerId === 3)!.points).toBe(2);
  });

  it("no voters correct: storyteller 0, others 2", () => {
    const faceUp = makeFaceUpCards(10);
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 30, reasoning: "" },
      { playerId: 2, votedCard: 40, reasoning: "" },
      { playerId: 3, votedCard: 20, reasoning: "" },
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    expect(scores.find((s) => s.playerId === 0)!.points).toBe(0);
    // Others get 2 (bonus) + received votes
    expect(scores.find((s) => s.playerId === 1)!.breakdown.allOrNoneBonus).toBe(2);
  });

  it("no voters correct: received votes still count", () => {
    const faceUp = makeFaceUpCards(10);
    // Two people vote for player 2's card (30)
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 30, reasoning: "" },
      { playerId: 2, votedCard: 40, reasoning: "" },
      { playerId: 3, votedCard: 30, reasoning: "" },
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    // Player 2 gets 2 (bonus) + 2 (received votes) = 4
    const p2 = scores.find((s) => s.playerId === 2)!;
    expect(p2.breakdown.allOrNoneBonus).toBe(2);
    expect(p2.breakdown.receivedVotes).toBe(2);
    expect(p2.points).toBe(4);
  });

  it("one voter correct: storyteller 3, correct voter 3 + received votes", () => {
    const faceUp = makeFaceUpCards(10);
    // Player 1 votes for storyteller (correct), player 2 votes for 30 (player 2's own? no, player 2 submitted 30)
    // Actually: player 2 votes for card 30 (submitted by player 2 — but that's their own card, unusual in real game)
    // Player 3 votes for card 20 (submitted by player 1)
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 10, reasoning: "" },
      { playerId: 2, votedCard: 40, reasoning: "" }, // votes for player 3's card
      { playerId: 3, votedCard: 20, reasoning: "" }, // votes for player 1's card
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    expect(scores.find((s) => s.playerId === 0)!.points).toBe(3); // storyteller bonus
    // Player 1: 3 (correct vote) + 1 (received vote from player 3) = 4
    expect(scores.find((s) => s.playerId === 1)!.points).toBe(4);
    // Player 3: 0 (wrong vote) + 1 (received vote from player 2) = 1
    expect(scores.find((s) => s.playerId === 3)!.points).toBe(1);
    // Player 2: 0 (wrong vote) + 0 (no votes received) = 0
    expect(scores.find((s) => s.playerId === 2)!.points).toBe(0);
  });

  it("two voters correct: storyteller 3, correct voters 3 + received votes", () => {
    const faceUp = makeFaceUpCards(10);
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 10, reasoning: "" },
      { playerId: 2, votedCard: 10, reasoning: "" },
      { playerId: 3, votedCard: 20, reasoning: "" }, // votes for player 1's card
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    expect(scores.find((s) => s.playerId === 0)!.points).toBe(3); // storyteller
    // Player 1: 3 (correct) + 1 (received from player 3) = 4
    expect(scores.find((s) => s.playerId === 1)!.points).toBe(4);
    expect(scores.find((s) => s.playerId === 2)!.points).toBe(3); // correct only
    expect(scores.find((s) => s.playerId === 3)!.points).toBe(0); // wrong vote, no votes received
  });

  it("votes on storyteller card don't give receivedVotes to storyteller", () => {
    const faceUp = makeFaceUpCards(10);
    const votes: VoteResult[] = [
      { playerId: 1, votedCard: 10, reasoning: "" },
      { playerId: 2, votedCard: 10, reasoning: "" },
      { playerId: 3, votedCard: 10, reasoning: "" },
    ];
    const scores = calculateScores(0, 10, faceUp, votes, allPlayerIds);

    // Storyteller should NOT get receivedVotes bonus (only non-storytellers do)
    const st = scores.find((s) => s.playerId === 0)!;
    expect(st.breakdown.receivedVotes).toBe(0);
  });
});
