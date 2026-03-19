export type CardId = number; // 0-79 index into CARD_MANIFEST

export type PlayerId = 0 | 1 | 2 | 3;

export interface Player {
  id: PlayerId;
  name: string;
  hand: CardId[];
}

export interface StorytellerResult {
  playerId: PlayerId;
  chosenCard: CardId;
  clue: string;
  reasoning: string;
}

export interface CardSelectionResult {
  playerId: PlayerId;
  chosenCard: CardId;
  reasoning: string;
}

export interface VoteResult {
  playerId: PlayerId;
  votedCard: CardId;
  reasoning: string;
}

export interface PlayerScore {
  playerId: PlayerId;
  points: number;
  breakdown: {
    correctVote: number;
    storytellerBonus: number;
    allOrNoneBonus: number;
    receivedVotes: number;
  };
}

export interface FaceUpCard {
  cardId: CardId;
  submittedBy: PlayerId;
  displayIndex: number;
}

export interface RoundResult {
  players: Player[];
  storyteller: StorytellerResult;
  cardSelections: CardSelectionResult[];
  faceUpCards: FaceUpCard[];
  votes: VoteResult[];
  scores: PlayerScore[];
}

export type GamePhase =
  | "idle"
  | "loading"
  | "setup"
  | "storyteller-thinking"
  | "clue-revealed"
  | "selecting-cards"
  | "cards-revealed"
  | "voting"
  | "results";
