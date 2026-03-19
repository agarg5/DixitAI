import type { CardId, PlayerId, FaceUpCard, VoteResult, PlayerScore } from "./types";
import { TOTAL_CARDS } from "./cards";

export function buildDeck(): CardId[] {
  return Array.from({ length: TOTAL_CARDS }, (_, i) => i);
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealHands(
  deck: CardId[],
  numPlayers: number,
  handSize: number
): { hands: CardId[][]; remainingDeck: CardId[] } {
  const hands: CardId[][] = [];
  let idx = 0;
  for (let p = 0; p < numPlayers; p++) {
    hands.push(deck.slice(idx, idx + handSize));
    idx += handSize;
  }
  return { hands, remainingDeck: deck.slice(idx) };
}

export function shuffleFaceUpCards(
  submissions: { cardId: CardId; submittedBy: PlayerId }[]
): FaceUpCard[] {
  const shuffled = shuffle(submissions);
  return shuffled.map((s, i) => ({
    cardId: s.cardId,
    submittedBy: s.submittedBy,
    displayIndex: i,
  }));
}

export function calculateScores(
  storytellerId: PlayerId,
  storytellerCard: CardId,
  faceUpCards: FaceUpCard[],
  votes: VoteResult[],
  allPlayerIds: PlayerId[]
): PlayerScore[] {
  const storytellerFaceUp = faceUpCards.find(
    (c) => c.submittedBy === storytellerId
  )!;
  const correctVoters = votes.filter(
    (v) => v.votedCard === storytellerFaceUp.cardId
  );
  const allFound = correctVoters.length === votes.length;
  const noneFound = correctVoters.length === 0;

  const scores: PlayerScore[] = allPlayerIds.map((pid) => ({
    playerId: pid,
    points: 0,
    breakdown: {
      correctVote: 0,
      storytellerBonus: 0,
      allOrNoneBonus: 0,
      receivedVotes: 0,
    },
  }));

  const getScore = (pid: PlayerId) => scores.find((s) => s.playerId === pid)!;

  if (allFound || noneFound) {
    // Storyteller gets 0, everyone else gets 2
    for (const pid of allPlayerIds) {
      if (pid !== storytellerId) {
        const s = getScore(pid);
        s.breakdown.allOrNoneBonus = 2;
        s.points += 2;
      }
    }
  } else {
    // Storyteller gets 3
    const storytellerScore = getScore(storytellerId);
    storytellerScore.breakdown.storytellerBonus = 3;
    storytellerScore.points += 3;

    // Correct voters get 3
    for (const v of correctVoters) {
      const s = getScore(v.playerId);
      s.breakdown.correctVote = 3;
      s.points += 3;
    }
  }

  // Each non-storyteller gets +1 per vote their card received
  for (const vote of votes) {
    const votedFaceUp = faceUpCards.find((c) => c.cardId === vote.votedCard);
    if (votedFaceUp && votedFaceUp.submittedBy !== storytellerId) {
      const s = getScore(votedFaceUp.submittedBy);
      s.breakdown.receivedVotes += 1;
      s.points += 1;
    }
  }

  return scores;
}
