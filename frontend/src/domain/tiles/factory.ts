import {
  type DragonColor,
  type NumberRank,
  type NumberSuit,
  type Tile,
  type WindDirection,
} from "./types";

export type MahjongSetOptions = {
  copiesPerTile?: number;
  numberSuits?: NumberSuit[];
  numberRanks?: NumberRank[];
  windDirections?: WindDirection[];
  dragonColors?: DragonColor[];
};

const DEFAULT_NUMBER_SUITS: NumberSuit[] = ["dots", "bamboo", "characters"];
const DEFAULT_NUMBER_RANKS: NumberRank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const DEFAULT_WIND_DIRECTIONS: WindDirection[] = [
  "east",
  "south",
  "west",
  "north",
];
const DEFAULT_DRAGON_COLORS: DragonColor[] = ["red", "green", "white"];
const DEFAULT_COPIES_PER_TILE = 4;

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createMahjongTileSet(
  options: MahjongSetOptions = {},
): Tile[] {
  const copiesPerTile = options.copiesPerTile ?? DEFAULT_COPIES_PER_TILE;
  const numberSuits = options.numberSuits ?? DEFAULT_NUMBER_SUITS;
  const numberRanks = options.numberRanks ?? DEFAULT_NUMBER_RANKS;
  const windDirections = options.windDirections ?? DEFAULT_WIND_DIRECTIONS;
  const dragonColors = options.dragonColors ?? DEFAULT_DRAGON_COLORS;

  const tiles: Tile[] = [];

  for (const suit of numberSuits) {
    for (const rank of numberRanks) {
      for (let copy = 1; copy <= copiesPerTile; copy += 1) {
        tiles.push({
          id: `number-${suit}-${rank}-${copy}`,
          type: "number",
          label: `${rank} of ${titleCase(suit)}`,
          value: { suit, rank },
        });
      }
    }
  }

  for (const direction of windDirections) {
    for (let copy = 1; copy <= copiesPerTile; copy += 1) {
      tiles.push({
        id: `wind-${direction}-${copy}`,
        type: "wind",
        label: `${titleCase(direction)} Wind`,
        value: direction,
      });
    }
  }

  for (const color of dragonColors) {
    for (let copy = 1; copy <= copiesPerTile; copy += 1) {
      tiles.push({
        id: `dragon-${color}-${copy}`,
        type: "dragon",
        label: `${titleCase(color)} Dragon`,
        value: color,
      });
    }
  }

  return tiles;
}

export function getMahjongTileSetCount(
  options: MahjongSetOptions = {},
): number {
  return createMahjongTileSet(options).length;
}

export const STANDARD_MAHJONG_TILE_COUNT = getMahjongTileSetCount();
