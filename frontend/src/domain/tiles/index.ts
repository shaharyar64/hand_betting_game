/** Module exports and wiring. */
export type {
  DragonColor,
  DragonTile,
  NumberRank,
  NumberSuit,
  NumberTile,
  Tile,
  TileType,
  WindDirection,
  WindTile,
} from "./types";

export {
  createMahjongTileSet,
  getMahjongTileSetCount,
  STANDARD_MAHJONG_TILE_COUNT,
  type MahjongSetOptions,
} from "./factory";

export {
  canReshuffle,
  createTileDeck,
  discardTile,
  drawTile,
  reshuffleDiscardIntoDrawPile,
  DEFAULT_MAX_RESHUFFLES,
  type CreateTileDeckOptions,
  type DrawTileResult,
  type TileDeckState,
} from "./deck";
