export type CardId = number; // 0-79 index into CARD_MANIFEST

export type PlayerId = 0 | 1 | 2 | 3;

export type PlayerType = "ai" | "human";

export type GameMode = "spectator" | "human-player";

export interface Player {
  id: PlayerId;
  name: string;
  hand: CardId[];
  playerType: PlayerType;
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

// Interactive game phases for human-player mode
export type InteractivePhase =
  | "mode-select"
  | "dealing"
  | "human-storyteller"     // human picks card + writes clue
  | "ai-storyteller"        // waiting for AI storyteller
  | "human-select-card"     // human picks card to match clue
  | "ai-selecting"          // waiting for AI card selections
  | "revealing"             // face-up cards shuffled
  | "human-vote"            // human votes
  | "ai-voting"             // waiting for AI votes
  | "scoring"
  | "results";
