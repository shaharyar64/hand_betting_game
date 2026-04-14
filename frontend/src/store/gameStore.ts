import { create } from "zustand";

import { type BetChoice, gameApi, type HandPayload } from "@/services/api";

type RoundHistoryItem = {
  id: number;
  bet: BetChoice;
  previousTotal: number;
  nextTotal: number;
  outcome: "win" | "lose";
  scoreDelta: number;
  scoreAfter: number;
};

type GameStore = {
  score: number;
  gameStatus: string;
  hand: HandPayload;
  history: RoundHistoryItem[];
  leaderboard: Array<{ score: number; created_at: string }>;
  loading: boolean;
  error: string | null;
  drawAnimationKey: number;
  startNewGame: () => Promise<void>;
  placeBet: (choice: BetChoice) => Promise<void>;
  loadLeaderboard: () => Promise<void>;
  clearError: () => void;
};

const EMPTY_HAND: HandPayload = {
  anchor_label: null,
  anchor_value: null,
  active_label: null,
  active_value: null,
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export const useGameStore = create<GameStore>((set, get) => ({
  score: 0,
  gameStatus: "idle",
  hand: EMPTY_HAND,
  history: [],
  leaderboard: [],
  loading: false,
  error: null,
  drawAnimationKey: 0,

  clearError: () => set({ error: null }),

  loadLeaderboard: async () => {
    try {
      const response = await gameApi.getLeaderboard();
      set({ leaderboard: response.data.top });
    } catch (error) {
      set({ error: errorMessage(error, "Failed to load leaderboard.") });
    }
  },

  startNewGame: async () => {
    set({ loading: true, error: null });
    try {
      const response = await gameApi.newGame();
      set((state) => ({
        score: response.data.score,
        gameStatus: response.data.game_status,
        hand: response.data.hand,
        history: [],
        drawAnimationKey: state.drawAnimationKey + 1,
      }));
      await get().loadLeaderboard();
    } catch (error) {
      set({ error: errorMessage(error, "Failed to start game.") });
    } finally {
      set({ loading: false });
    }
  },

  placeBet: async (choice: BetChoice) => {
    set({ loading: true, error: null });
    try {
      const response = await gameApi.placeBet(choice);
      const round = response.data.last_round;

      set((state) => ({
        score: response.data.score,
        gameStatus: response.data.game_status,
        hand: response.data.next_hand,
        drawAnimationKey: state.drawAnimationKey + 1,
        history:
          round === null
            ? state.history
            : [
                {
                  id: state.history.length + 1,
                  bet: round.bet,
                  previousTotal: round.previous_total,
                  nextTotal: round.next_total,
                  outcome: round.outcome,
                  scoreDelta: round.score_delta,
                  scoreAfter: response.data.score,
                },
                ...state.history,
              ],
      }));

      await get().loadLeaderboard();
    } catch (error) {
      set({ error: errorMessage(error, "Failed to place bet.") });
    } finally {
      set({ loading: false });
    }
  },
}));

export type { RoundHistoryItem };
