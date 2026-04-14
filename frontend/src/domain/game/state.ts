import {
  createTileDeck,
  discardTile,
  drawTile,
  type CreateTileDeckOptions,
  type TileDeckState,
} from "../tiles";
import type { Tile } from "../tiles";

export type HandOutcome = "win" | "loss";
export type GameOverReason = "score_depleted" | "max_hands_reached" | "no_tiles_remaining";

export type ActiveHand = {
  handNumber: number;
  tile: Tile;
  bet: number;
};

export type HandHistoryEntry = {
  handNumber: number;
  tile: Tile;
  bet: number;
  outcome: HandOutcome;
  scoreDelta: number;
  scoreAfterHand: number;
};

export type GameState = {
  score: number;
  deck: TileDeckState;
  activeHand: ActiveHand | null;
  history: HandHistoryEntry[];
  gameOver: boolean;
  gameOverReason: GameOverReason | null;
  maxHands: number;
};

export type CreateGameOptions = {
  initialScore?: number;
  maxHands?: number;
  defaultBet?: number;
  deck?: CreateTileDeckOptions;
  specialTileScaling?: Partial<Record<Tile["type"], number>>;
};

const DEFAULT_INITIAL_SCORE = 100;
const DEFAULT_MAX_HANDS = 20;
const DEFAULT_BET = 10;
const WIN_POINTS = 10;
const LOSS_POINTS = -5;

const DEFAULT_SPECIAL_TILE_SCALING: Record<Tile["type"], number> = {
  number: 0,
  wind: 1,
  dragon: 2,
};

function getScoreDelta(
  outcome: HandOutcome,
  tile: Tile,
  bet: number,
  specialTileScaling: Record<Tile["type"], number>,
): number {
  if (outcome === "loss") {
    return LOSS_POINTS;
  }

  const scaling = specialTileScaling[tile.type];
  const specialBonus = Math.max(0, Math.floor(bet * scaling));
  return WIN_POINTS + specialBonus;
}

function getScoreDepleted(score: number): boolean {
  return score <= 0;
}

export function createGameState(options: CreateGameOptions = {}): GameState {
  const initialScore = options.initialScore ?? DEFAULT_INITIAL_SCORE;
  const maxHands = options.maxHands ?? DEFAULT_MAX_HANDS;
  const defaultBet = options.defaultBet ?? DEFAULT_BET;
  const deck = createTileDeck(options.deck);

  const state: GameState = {
    score: initialScore,
    deck,
    activeHand: null,
    history: [],
    gameOver: false,
    gameOverReason: null,
    maxHands,
  };

  return startHand(state, defaultBet);
}

export function startHand(state: GameState, bet: number = DEFAULT_BET): GameState {
  if (state.gameOver || state.activeHand !== null) {
    return state;
  }

  if (state.history.length >= state.maxHands) {
    return {
      ...state,
      gameOver: true,
      gameOverReason: "max_hands_reached",
    };
  }

  const { tile, state: nextDeckState } = drawTile(state.deck);
  if (!tile) {
    return {
      ...state,
      deck: nextDeckState,
      gameOver: true,
      gameOverReason: "no_tiles_remaining",
    };
  }

  return {
    ...state,
    deck: nextDeckState,
    activeHand: {
      handNumber: state.history.length + 1,
      tile,
      bet: Math.max(1, Math.floor(bet)),
    },
  };
}

export function placeBet(state: GameState, bet: number): GameState {
  if (!state.activeHand || state.gameOver) {
    return state;
  }

  const normalizedBet = Math.max(1, Math.floor(bet));
  return {
    ...state,
    activeHand: {
      ...state.activeHand,
      bet: normalizedBet,
    },
  };
}

export function resolveHand(
  state: GameState,
  outcome: HandOutcome,
  options: Pick<CreateGameOptions, "specialTileScaling"> = {},
): GameState {
  if (!state.activeHand || state.gameOver) {
    return state;
  }

  const specialTileScaling = {
    ...DEFAULT_SPECIAL_TILE_SCALING,
    ...options.specialTileScaling,
  };

  const { tile, bet, handNumber } = state.activeHand;
  const scoreDelta = getScoreDelta(outcome, tile, bet, specialTileScaling);
  const nextScore = state.score + scoreDelta;
  const nextDeck = discardTile(state.deck, tile);

  const historyEntry: HandHistoryEntry = {
    handNumber,
    tile,
    bet,
    outcome,
    scoreDelta,
    scoreAfterHand: nextScore,
  };

  const nextHistory = [...state.history, historyEntry];
  const reachedMaxHands = nextHistory.length >= state.maxHands;
  const scoreDepleted = getScoreDepleted(nextScore);

  return {
    ...state,
    score: nextScore,
    deck: nextDeck,
    activeHand: null,
    history: nextHistory,
    gameOver: scoreDepleted || reachedMaxHands,
    gameOverReason: scoreDepleted
      ? "score_depleted"
      : reachedMaxHands
        ? "max_hands_reached"
        : null,
  };
}
