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
