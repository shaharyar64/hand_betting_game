"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

import { useGameStore } from "@/store/gameStore";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function TileCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.32 }}
      className={`group relative rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg transition hover:-translate-y-0.5 ${accent}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-sky-400/90 to-violet-400/90" />
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Tile</p>
      <p className="mt-3 text-lg font-semibold text-white">{label}</p>
      <p className="mt-2 text-3xl font-bold text-sky-300">{value ?? "-"}</p>
    </motion.div>
  );
}

export function GameDashboard() {
  const score = useGameStore((state) => state.score);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const hand = useGameStore((state) => state.hand);
  const history = useGameStore((state) => state.history);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const loading = useGameStore((state) => state.loading);
  const error = useGameStore((state) => state.error);
  const drawAnimationKey = useGameStore((state) => state.drawAnimationKey);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const placeBet = useGameStore((state) => state.placeBet);

  const currentHandValue = (hand.anchor_value ?? 0) + (hand.active_value ?? 0);

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
          Place your bet, draw a new tile, and outscore the table.
        </p>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Score" value={score} />
        <StatCard label="Current Hand Value" value={currentHandValue} />
        <StatCard label="Game Status" value={gameStatus} />
        <StatCard label="Hands Played" value={history.length} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
      >
        <h2 className="text-lg font-semibold text-white">Tiles</h2>
        <AnimatePresence mode="wait">
          <motion.div
            key={drawAnimationKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 grid gap-4 md:grid-cols-2"
          >
            <TileCard
              label={hand.anchor_label ?? "Anchor"}
              value={hand.anchor_value}
              accent="hover:shadow-sky-500/15"
            />
            <TileCard
              label={hand.active_label ?? "Active"}
              value={hand.active_value}
              accent="hover:shadow-violet-500/15"
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void placeBet("higher")}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Higher
          </button>
          <button
            type="button"
            onClick={() => void placeBet("lower")}
            disabled={loading}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Lower
          </button>
          <button
            type="button"
            onClick={() => void startNewGame()}
            disabled={loading}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            New Game
          </button>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white">History</h3>
          {history.length > 0 ? (
            <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1 text-sm text-slate-300">
              {history.map((round) => (
                <div
                  key={round.id}
                  className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2"
                >
                  <p className="font-medium text-slate-200">
                    Hand #{round.id}: {round.bet} ({round.previousTotal} → {round.nextTotal})
                  </p>
                  <p className="text-xs text-slate-400">
                    {round.outcome.toUpperCase()} | Delta: {round.scoreDelta} | Score:{" "}
                    {round.scoreAfter}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No resolved hands yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white">Leaderboard (Top 5)</h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
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

      {error ? (
        <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
