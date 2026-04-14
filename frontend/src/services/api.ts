const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export type BetChoice = "higher" | "lower";

export type HandPayload = {
  anchor_label: string | null;
  anchor_value: number | null;
  active_label: string | null;
  active_value: number | null;
};

export type NewGameResponse = {
  ok: boolean;
  message: string;
  data: {
    score: number;
    game_status: string;
    hand: HandPayload;
    history_count: number;
  };
};

export type HandResponse = {
  ok: boolean;
  data: {
    score: number;
    game_status: string;
    bet: BetChoice | null;
    hand: HandPayload;
    history_count: number;
  };
};

export type BetResponse = {
  ok: boolean;
  data: {
    score: number;
    game_status: string;
    game_over_reason: string | null;
    history_count: number;
    last_round: {
      bet: BetChoice;
      previous_total: number;
      next_total: number;
      outcome: "win" | "lose";
      score_delta: number;
    } | null;
    next_hand: HandPayload;
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
