"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PlayerId,
  Player,
  CardId,
  InteractivePhase,
  StorytellerResult,
  CardSelectionResult,
  FaceUpCard,
  VoteResult,
  RoundResult,
} from "@/lib/types";
import {
  buildDeck,
  shuffle,
  dealHands,
  shuffleFaceUpCards,
  calculateScores,
} from "@/lib/game-engine";

const PLAYER_NAMES = ["You", "Bob", "Carol", "Dave"];
const HUMAN_PLAYER_ID: PlayerId = 0;

export interface HumanRoundState {
  phase: InteractivePhase;
  players: Player[];
  storytellerId: PlayerId;
  clue: string | null;
  humanHand: CardId[];
  faceUpCards: FaceUpCard[];
  roundResult: RoundResult | null;
  error: string | null;
  isLoading: boolean;
}

export function useHumanRound() {
  const [state, setState] = useState<HumanRoundState>({
    phase: "mode-select",
    players: [],
    storytellerId: 0,
    clue: null,
    humanHand: [],
    faceUpCards: [],
    roundResult: null,
    error: null,
    isLoading: false,
  });

  // Refs to avoid stale closures in async functions
  const playersRef = useRef<Player[]>([]);
  const storytellerResultRef = useRef<StorytellerResult | null>(null);
  const cardSelectionsRef = useRef<CardSelectionResult[]>([]);
  const faceUpCardsRef = useRef<FaceUpCard[]>([]);

  function setError(msg: string) {
    setState((prev) => ({ ...prev, error: msg, isLoading: false }));
  }

  const startRound = useCallback((preference: "storyteller" | "participant" | "random" = "random") => {
    const deck = shuffle(buildDeck());
    const { hands } = dealHands(deck, 4, 6);

    let storytellerId: PlayerId;
    if (preference === "storyteller") {
      storytellerId = HUMAN_PLAYER_ID;
    } else if (preference === "participant") {
      // Pick a random AI as storyteller
      storytellerId = ([1, 2, 3] as PlayerId[])[Math.floor(Math.random() * 3)];
    } else {
      storytellerId = Math.floor(Math.random() * 4) as PlayerId;
    }

    const players: Player[] = hands.map((hand, i) => ({
      id: i as PlayerId,
      name: PLAYER_NAMES[i],
      hand,
      playerType: i === HUMAN_PLAYER_ID ? ("human" as const) : ("ai" as const),
    }));

    playersRef.current = players;
    storytellerResultRef.current = null;
    cardSelectionsRef.current = [];

    setState({
      phase: "dealing",
      players,
      storytellerId,
      clue: null,
      humanHand: players[HUMAN_PLAYER_ID].hand,
      faceUpCards: [],
      roundResult: null,
      error: null,
      isLoading: false,
    });

    const isHumanStoryteller = storytellerId === HUMAN_PLAYER_ID;
    setTimeout(() => {
      if (isHumanStoryteller) {
        setState((prev) => ({ ...prev, phase: "human-storyteller" }));
      } else {
        setState((prev) => ({ ...prev, phase: "ai-storyteller", isLoading: true }));
        runAIStoryteller(storytellerId, players);
      }
    }, 1500);
  }, []);

  // ── AI Storyteller ──
  async function runAIStoryteller(stId: PlayerId, players: Player[]) {
    try {
      const res = await fetch("/api/game/storyteller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: stId, hand: players[stId].hand }),
      });
      if (!res.ok) throw new Error("Storyteller API failed");
      const result: StorytellerResult = await res.json();
      storytellerResultRef.current = result;

      // AI is storyteller → human needs to select a card
      setState((prev) => ({
        ...prev,
        clue: result.clue,
        phase: "human-select-card",
        isLoading: false,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ── Human submits storyteller choice ──
  const submitStorytellerChoice = useCallback((chosenCard: CardId, clue: string) => {
    const result: StorytellerResult = {
      playerId: HUMAN_PLAYER_ID,
      chosenCard,
      clue,
      reasoning: "Human player choice",
    };
    storytellerResultRef.current = result;

    setState((prev) => ({
      ...prev,
      clue,
      phase: "ai-selecting",
      isLoading: true,
    }));

    // Human is storyteller → all 3 AIs select cards, then go to voting
    runAISelectionsForStorytellerHuman(result, playersRef.current);
  }, []);

  // When human is storyteller: fetch all 3 AI card selections, build face-up, go to AI voting
  async function runAISelectionsForStorytellerHuman(
    stResult: StorytellerResult,
    players: Player[]
  ) {
    try {
      const aiPlayers = players.filter(
        (p) => p.id !== stResult.playerId && p.playerType === "ai"
      );

      const aiSelections = await Promise.all(
        aiPlayers.map((p) =>
          fetch("/api/game/select-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: p.id, hand: p.hand, clue: stResult.clue }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Card selection failed for player ${p.id}`);
            return res.json() as Promise<CardSelectionResult>;
          })
        )
      );

      cardSelectionsRef.current = aiSelections;

      // Build face-up cards: storyteller's card + 3 AI selections
      const submissions = [
        { cardId: stResult.chosenCard, submittedBy: stResult.playerId },
        ...aiSelections.map((s) => ({ cardId: s.chosenCard, submittedBy: s.playerId })),
      ];
      const faceUp = shuffleFaceUpCards(submissions);
      faceUpCardsRef.current = faceUp;

      setState((prev) => ({
        ...prev,
        faceUpCards: faceUp,
        phase: "revealing",
        isLoading: false,
      }));

      // After reveal pause, go to AI voting (human is storyteller = doesn't vote)
      setTimeout(() => {
        runAIVotesOnly(faceUp, aiSelections, stResult, players);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ── Human submits card selection (AI is storyteller) ──
  const submitCardSelection = useCallback((chosenCard: CardId) => {
    const humanSelection: CardSelectionResult = {
      playerId: HUMAN_PLAYER_ID,
      chosenCard,
      reasoning: "Human player choice",
    };

    setState((prev) => ({
      ...prev,
      phase: "ai-selecting",
      isLoading: true,
    }));

    const stResult = storytellerResultRef.current;
    if (!stResult) return;

    // AI is storyteller → 2 other AIs need to select + human already selected
    runAISelectionsWithHuman(humanSelection, stResult, playersRef.current);
  }, []);

  // When AI is storyteller and human selected: fetch remaining AI selections
  async function runAISelectionsWithHuman(
    humanSelection: CardSelectionResult,
    stResult: StorytellerResult,
    players: Player[]
  ) {
    try {
      // AIs that need to select: not storyteller, not human
      const aiPlayers = players.filter(
        (p) => p.id !== stResult.playerId && p.id !== HUMAN_PLAYER_ID && p.playerType === "ai"
      );

      const aiSelections = await Promise.all(
        aiPlayers.map((p) =>
          fetch("/api/game/select-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: p.id, hand: p.hand, clue: stResult.clue }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Card selection failed for player ${p.id}`);
            return res.json() as Promise<CardSelectionResult>;
          })
        )
      );

      const allSelections = [humanSelection, ...aiSelections];
      cardSelectionsRef.current = allSelections;

      // Build face-up: storyteller card + human card + AI cards
      const submissions = [
        { cardId: stResult.chosenCard, submittedBy: stResult.playerId },
        ...allSelections.map((s) => ({ cardId: s.chosenCard, submittedBy: s.playerId })),
      ];
      const faceUp = shuffleFaceUpCards(submissions);
      faceUpCardsRef.current = faceUp;

      setState((prev) => ({
        ...prev,
        faceUpCards: faceUp,
        phase: "revealing",
        isLoading: false,
      }));

      // After reveal, human needs to vote
      setTimeout(() => {
        setState((prev) => ({ ...prev, phase: "human-vote" }));
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ── Human submits vote ──
  const submitVote = useCallback((votedCard: CardId) => {
    const humanVote: VoteResult = {
      playerId: HUMAN_PLAYER_ID,
      votedCard,
      reasoning: "Human player choice",
    };

    setState((prev) => ({
      ...prev,
      phase: "ai-voting",
      isLoading: true,
    }));

    const stResult = storytellerResultRef.current;
    const selections = cardSelectionsRef.current;
    const faceUp = faceUpCardsRef.current;
    if (!stResult || faceUp.length === 0) return;

    runAIVotesWithHuman(humanVote, faceUp, selections, stResult, playersRef.current);
  }, []);

  // All AI voting (human is storyteller, doesn't vote)
  async function runAIVotesOnly(
    faceUp: FaceUpCard[],
    selections: CardSelectionResult[],
    stResult: StorytellerResult,
    players: Player[]
  ) {
    setState((prev) => ({ ...prev, isLoading: true, phase: "ai-voting" }));
    try {
      const aiVotes = await Promise.all(
        selections.map((s) =>
          fetch("/api/game/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId: s.playerId,
              faceUpCards: faceUp,
              ownCardId: s.chosenCard,
              clue: stResult.clue,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Vote failed for player ${s.playerId}`);
            return res.json() as Promise<VoteResult>;
          })
        )
      );

      finishRound(aiVotes, faceUp, selections, stResult, players);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // Mixed voting (human + AIs vote, AI is storyteller)
  async function runAIVotesWithHuman(
    humanVote: VoteResult,
    faceUp: FaceUpCard[],
    selections: CardSelectionResult[],
    stResult: StorytellerResult,
    players: Player[]
  ) {
    try {
      // AIs that vote: non-storyteller, non-human
      const aiVoterSelections = selections.filter(
        (s) => s.playerId !== HUMAN_PLAYER_ID && s.playerId !== stResult.playerId
      );

      const aiVotes = await Promise.all(
        aiVoterSelections.map((s) =>
          fetch("/api/game/vote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              playerId: s.playerId,
              faceUpCards: faceUp,
              ownCardId: s.chosenCard,
              clue: stResult.clue,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Vote failed for player ${s.playerId}`);
            return res.json() as Promise<VoteResult>;
          })
        )
      );

      finishRound([humanVote, ...aiVotes], faceUp, selections, stResult, players);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function finishRound(
    allVotes: VoteResult[],
    faceUp: FaceUpCard[],
    selections: CardSelectionResult[],
    stResult: StorytellerResult,
    players: Player[]
  ) {
    const allPlayerIds = players.map((p) => p.id);
    const scores = calculateScores(
      stResult.playerId,
      stResult.chosenCard,
      faceUp,
      allVotes,
      allPlayerIds
    );

    const result: RoundResult = {
      players,
      storyteller: stResult,
      cardSelections: selections,
      faceUpCards: faceUp,
      votes: allVotes,
      scores,
    };

    setState((prev) => ({
      ...prev,
      roundResult: result,
      phase: "results",
      isLoading: false,
    }));
  }

  return {
    state,
    startRound,
    submitStorytellerChoice,
    submitCardSelection,
    submitVote,
  };
}
