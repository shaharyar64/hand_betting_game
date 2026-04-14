import type { BetChoice, HandPayload } from "@/services/api";

export type LastRound = {
  bet: BetChoice;
  previous_total: number;
  next_total: number;
  outcome: "win" | "lose";
  score_delta: number;
};

export type GameViewState = {
  score: number;
  gameStatus: string;
  hand: HandPayload;
  historyCount: number;
  leaderboard: Array<{ score: number; created_at: string }>;
  loading: boolean;
  error: string | null;
  lastRound: LastRound | null;
};

export type GameAction =
  | { type: "set_loading"; payload: boolean }
  | { type: "set_error"; payload: string | null }
  | {
      type: "set_game";
      payload: Pick<GameViewState, "score" | "gameStatus" | "hand" | "historyCount">;
    }
  | { type: "set_leaderboard"; payload: GameViewState["leaderboard"] }
  | { type: "set_last_round"; payload: LastRound | null };

export const initialGameState: GameViewState = {
  score: 0,
  gameStatus: "idle",
  hand: {
    anchor_label: null,
    anchor_value: null,
    active_label: null,
    active_value: null,
  },
  historyCount: 0,
  leaderboard: [],
  loading: false,
  error: null,
  lastRound: null,
};

export function gameReducer(state: GameViewState, action: GameAction): GameViewState {
  switch (action.type) {
    case "set_loading":
      return { ...state, loading: action.payload };
    case "set_error":
      return { ...state, error: action.payload };
    case "set_game":
      return {
        ...state,
        score: action.payload.score,
        gameStatus: action.payload.gameStatus,
        hand: action.payload.hand,
        historyCount: action.payload.historyCount,
      };
    case "set_leaderboard":
      return { ...state, leaderboard: action.payload };
    case "set_last_round":
      return { ...state, lastRound: action.payload };
    default:
      return state;
  }
}
