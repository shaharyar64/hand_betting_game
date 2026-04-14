const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type BetChoice = "higher" | "lower";

export type HandPayload = {
  anchor_label: string | null;
  anchor_value: number | null;
  active_label: string | null;
  active_value: number | null;
};

export type TilePayload = {
  id: string;
  type: string;
  value: number;
  label: string;
};

export type RoundHistoryPayload = {
  bet: BetChoice;
  previous_total: number;
  next_total: number;
  outcome: "win" | "lose";
  score_delta: number;
  score_after_round: number;
  tiles: {
    anchor: TilePayload;
    active: TilePayload;
    drawn: TilePayload;
  };
};

export type DeckPayload = {
  draw_pile_count: number;
  discard_pile_count: number;
  reshuffle_count: number;
};

export type NewGameResponse = {
  ok: boolean;
  message: string;
  data: {
    score: number;
    game_status: string;
    game_over_reason: string | null;
    hand: HandPayload;
    tiles: TilePayload[];
    deck: DeckPayload;
    history_count: number;
    history: RoundHistoryPayload[];
  };
};

export type HandResponse = {
  ok: boolean;
  data: {
    score: number;
    game_status: string;
    game_over_reason: string | null;
    bet: BetChoice | null;
    hand: HandPayload;
    tiles: TilePayload[];
    deck: DeckPayload;
    history_count: number;
    history: RoundHistoryPayload[];
  };
};

export type BetResponse = {
  ok: boolean;
  data: {
    score: number;
    game_status: string;
    game_over_reason: string | null;
    deck: DeckPayload;
    history_count: number;
    result: boolean | null;
    last_round: RoundHistoryPayload | null;
    history: RoundHistoryPayload[];
    next_hand: HandPayload;
    next_tiles: TilePayload[];
  };
};

export type LeaderboardResponse = {
  ok: boolean;
  data: {
    top: Array<{
      score: number;
      created_at: string;
    }>;
  };
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`;
    let message = fallback;
    try {
      const body = (await response.json()) as { detail?: string };
      message = body.detail ?? fallback;
    } catch {
      message = fallback;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const gameApi = {
  newGame: () => request<NewGameResponse>("/new-game", { method: "POST" }),
  getHand: () => request<HandResponse>("/hand"),
  placeBet: (choice: BetChoice) =>
    request<BetResponse>(`/bet/${choice}`, { method: "POST" }),
  getLeaderboard: () => request<LeaderboardResponse>("/leaderboard"),
};
