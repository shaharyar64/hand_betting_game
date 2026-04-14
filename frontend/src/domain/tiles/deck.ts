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
  const shuffled = [...tiles];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createTileDeck(options: CreateTileDeckOptions = {}): TileDeckState {
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
  return {
    ...state,
    discardPile: [...state.discardPile, tile],
  };
}

export function canReshuffle(state: TileDeckState): boolean {
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
