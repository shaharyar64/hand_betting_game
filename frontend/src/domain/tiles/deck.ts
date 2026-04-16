/** Tile deck utilities for shuffle, draw, discard, and reshuffle flow. */
import { createMahjongTileSet, type MahjongSetOptions } from "./factory";
import type { Tile } from "./types";

export const DEFAULT_MAX_RESHUFFLES = 3;

export type TileDeckState = {
  drawPile: Tile[];
  discardPile: Tile[];
  reshufflesUsed: number;
  maxReshuffles: number;
};

export type CreateTileDeckOptions = {
  setOptions?: MahjongSetOptions;
  maxReshuffles?: number;
  random?: () => number;
};

export type DrawTileResult = {
  tile: Tile | null;
  state: TileDeckState;
  reshuffled: boolean;
};

function shuffleTiles(tiles: Tile[], random: () => number): Tile[] {
  /** Return a Fisher-Yates shuffled copy of tile input. */
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createTileDeck(options: CreateTileDeckOptions = {}): TileDeckState {
  /** Build an initialized deck state with shuffled draw pile. */
  const random = options.random ?? Math.random;
  const maxReshuffles = options.maxReshuffles ?? DEFAULT_MAX_RESHUFFLES;
  const tiles = createMahjongTileSet(options.setOptions);

  return {
    drawPile: shuffleTiles(tiles, random),
    discardPile: [],
    reshufflesUsed: 0,
    maxReshuffles,
  };
}

export function discardTile(state: TileDeckState, tile: Tile): TileDeckState {
  /** Append a tile to discard pile while preserving immutability. */
  return {
    ...state,
    discardPile: [...state.discardPile, tile],
  };
}

export function canReshuffle(state: TileDeckState): boolean {
  /** Check whether reshuffle conditions are currently satisfied. */
  return (
    state.drawPile.length === 0 &&
    state.discardPile.length > 0 &&
    state.reshufflesUsed < state.maxReshuffles
  );
}

export function reshuffleDiscardIntoDrawPile(
  state: TileDeckState,
  random: () => number = Math.random,
): TileDeckState {
  /** Move discard pile into draw pile, shuffle, and increment reshuffle usage. */
  if (!canReshuffle(state)) {
    return state;
  }

  return {
    ...state,
    drawPile: shuffleTiles(state.discardPile, random),
    discardPile: [],
    reshufflesUsed: state.reshufflesUsed + 1,
  };
}

export function drawTile(
  state: TileDeckState,
  random: () => number = Math.random,
): DrawTileResult {
  /** Draw one tile and trigger reshuffle automatically when eligible. */
  let nextState = state;
  let reshuffled = false;

  if (nextState.drawPile.length === 0 && canReshuffle(nextState)) {
    nextState = reshuffleDiscardIntoDrawPile(nextState, random);
    reshuffled = true;
  }

  if (nextState.drawPile.length === 0) {
    return {
      tile: null,
      state: nextState,
      reshuffled,
    };
  }

  const [tile, ...remaining] = nextState.drawPile;
  return {
    tile,
    state: {
      ...nextState,
      drawPile: remaining,
    },
    reshuffled,
  };
}
