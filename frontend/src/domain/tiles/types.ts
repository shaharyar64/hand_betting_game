/** Application module. */
export type TileType = "number" | "wind" | "dragon";

export type NumberSuit = "dots" | "bamboo" | "characters";
export type NumberRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type WindDirection = "east" | "south" | "west" | "north";
export type DragonColor = "red" | "green" | "white";

export type NumberTile = {
  id: string;
  type: "number";
  label: string;
  value: {
    suit: NumberSuit;
    rank: NumberRank;
  };
};

export type WindTile = {
  id: string;
  type: "wind";
  label: string;
  value: WindDirection;
};

export type DragonTile = {
  id: string;
  type: "dragon";
  label: string;
  value: DragonColor;
};

export type Tile = NumberTile | WindTile | DragonTile;
