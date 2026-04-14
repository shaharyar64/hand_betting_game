"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useReducer } from "react";

import { type BetChoice, gameApi } from "@/services/api";
import { gameReducer, initialGameState } from "@/store/gameStore";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function GameDashboard() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const loadLeaderboard = useCallback(async () => {
    const leaderboard = await gameApi.getLeaderboard();
    dispatch({ type: "set_leaderboard", payload: leaderboard.data.top });
  }, []);

  const startNewGame = useCallback(async () => {
    dispatch({ type: "set_loading", payload: true });
    dispatch({ type: "set_error", payload: null });
    try {
      const response = await gameApi.newGame();
      dispatch({
        type: "set_game",
        payload: {
          score: response.data.score,
          gameStatus: response.data.game_status,
          hand: response.data.hand,
          historyCount: response.data.history_count,
        },
      });
      dispatch({ type: "set_last_round", payload: null });
      await loadLeaderboard();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start game.";
      dispatch({ type: "set_error", payload: message });
    } finally {
      dispatch({ type: "set_loading", payload: false });
    }
  }, [loadLeaderboard]);

  const placeBet = useCallback(
    async (choice: BetChoice) => {
      dispatch({ type: "set_loading", payload: true });
      dispatch({ type: "set_error", payload: null });
      try {
        const response = await gameApi.placeBet(choice);
        dispatch({
          type: "set_game",
          payload: {
            score: response.data.score,
            gameStatus: response.data.game_status,
            hand: response.data.next_hand,
            historyCount: response.data.history_count,
          },
        });
        dispatch({ type: "set_last_round", payload: response.data.last_round });
        await loadLeaderboard();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to place bet.";
        dispatch({ type: "set_error", payload: message });
      } finally {
        dispatch({ type: "set_loading", payload: false });
      }
    },
    [loadLeaderboard],
  );

  useEffect(() => {
    void startNewGame();
  }, [startNewGame]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white">Hand Betting Game</h1>
        <p className="mt-2 text-sm text-slate-300">
          Next.js App Router + Tailwind CSS + Framer Motion starter.
        </p>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Score" value={state.score} />
        <StatCard label="Game Status" value={state.gameStatus} />
        <StatCard label="Hands Played" value={state.historyCount} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
      >
        <h2 className="text-lg font-semibold text-white">Current Hand</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard label="Anchor Tile" value={state.hand.anchor_label ?? "-"} />
          <StatCard label="Anchor Value" value={state.hand.anchor_value ?? "-"} />
          <StatCard label="Active Tile" value={state.hand.active_label ?? "-"} />
          <StatCard label="Active Value" value={state.hand.active_value ?? "-"} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void placeBet("higher")}
            disabled={state.loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Higher
          </button>
          <button
            type="button"
            onClick={() => void placeBet("lower")}
            disabled={state.loading}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Lower
          </button>
          <button
            type="button"
            onClick={() => void startNewGame()}
            disabled={state.loading}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            New Game
          </button>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white">Last Round</h3>
          {state.lastRound ? (
            <div className="mt-3 space-y-1 text-sm text-slate-300">
              <p>Bet: {state.lastRound.bet}</p>
              <p>Totals: {state.lastRound.previous_total} → {state.lastRound.next_total}</p>
              <p>
                Outcome: <span className="font-semibold">{state.lastRound.outcome}</span> (
                {state.lastRound.score_delta})
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No rounds resolved yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white">Leaderboard (Top 5)</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            {state.leaderboard.length > 0 ? (
              state.leaderboard.map((entry, index) => (
                <li key={`${entry.created_at}-${index}`} className="flex items-center justify-between">
                  <span>#{index + 1}</span>
                  <span className="font-semibold">{entry.score}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400">No scores yet.</li>
            )}
          </ol>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
