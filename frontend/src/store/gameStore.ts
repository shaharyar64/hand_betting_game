import { create } from "zustand";

import {
  type BetChoice,
  gameApi,
  type HandPayload,
  type RoundHistoryPayload,
  type TilePayload,
} from "@/services/api";

type RoundHistoryItem = {
  id: number;
  bet: BetChoice;
  previousTotal: number;
  nextTotal: number;
  outcome: "win" | "lose";
  scoreDelta: number;
  scoreAfter: number;
  tiles: RoundHistoryPayload["tiles"];
};

type GameStore = {
  score: number;
  gameStatus: string;
  gameOverReason: string | null;
  hand: HandPayload;
  tiles: TilePayload[];
  history: RoundHistoryItem[];
  leaderboard: Array<{ score: number; created_at: string }>;
  drawPileCount: number;
  discardPileCount: number;
  reshuffleCount: number;
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
  gameOverReason: null,
  hand: EMPTY_HAND,
  tiles: [],
  history: [],
  leaderboard: [],
  drawPileCount: 0,
  discardPileCount: 0,
  reshuffleCount: 0,
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
        gameOverReason: response.data.game_over_reason,
        hand: response.data.hand,
        tiles: response.data.tiles,
        drawPileCount: response.data.deck.draw_pile_count,
        discardPileCount: response.data.deck.discard_pile_count,
        reshuffleCount: response.data.deck.reshuffle_count,
        history: response.data.history.map((round, index) => ({
          id: response.data.history.length - index,
          bet: round.bet,
          previousTotal: round.previous_total,
          nextTotal: round.next_total,
          outcome: round.outcome,
          scoreDelta: round.score_delta,
          scoreAfter: round.score_after_round,
          tiles: round.tiles,
        })),
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

      set((state) => ({
        score: response.data.score,
        gameStatus: response.data.game_status,
        gameOverReason: response.data.game_over_reason,
        hand: response.data.next_hand,
        tiles: response.data.next_tiles,
        drawPileCount: response.data.deck.draw_pile_count,
        discardPileCount: response.data.deck.discard_pile_count,
        reshuffleCount: response.data.deck.reshuffle_count,
        drawAnimationKey: state.drawAnimationKey + 1,
        history: response.data.history.map((item, index) => ({
          id: response.data.history.length - index,
          bet: item.bet,
          previousTotal: item.previous_total,
          nextTotal: item.next_total,
          outcome: item.outcome,
          scoreDelta: item.score_delta,
          scoreAfter: item.score_after_round,
          tiles: item.tiles,
        })),
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
