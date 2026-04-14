"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useEffect } from "react";

import { useGameStore } from "@/store/gameStore";
import { TileCard } from "./TileCard";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
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
  const latestOutcome = history[0]?.outcome ?? null;
  const tileResultState =
    gameStatus === "awaiting_bet" || gameStatus === "resolved" ? latestOutcome : null;

  const pageVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut" as const,
      },
    },
  };

  useEffect(() => {
    void startNewGame();
  }, [startNewGame]);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 330, damping: 24 }}
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
        transition={{ type: "spring", stiffness: 330, damping: 24 }}
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
              resultState={tileResultState}
              accentClassName="ring-1 ring-white/10"
            />
            <TileCard
              label={hand.active_label ?? "Active"}
              value={hand.active_value}
              resultState={tileResultState}
              accentClassName="ring-1 ring-white/10"
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-wrap gap-3">
          <motion.button
            whileHover={{ filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
            type="button"
            onClick={() => void placeBet("higher")}
            disabled={loading}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Higher
          </motion.button>
          <motion.button
            whileHover={{ filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
            type="button"
            onClick={() => void placeBet("lower")}
            disabled={loading}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Lower
          </motion.button>
          <motion.button
            whileHover={{ filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
            type="button"
            onClick={() => void startNewGame()}
            disabled={loading}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            New Game
          </motion.button>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-base font-semibold text-white">History</h3>
          {history.length > 0 ? (
            <motion.div layout className="mt-3 max-h-72 space-y-2 overflow-auto pr-1 text-sm">
              <AnimatePresence initial={false}>
                {history.map((round, index) => (
                  <motion.div
                    layout
                  key={round.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: Math.max(0.45, 1 - index * 0.12), y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 360, damping: 25 }}
                    style={{ marginTop: index === 0 ? 0 : -2 }}
                    className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-slate-300"
                >
                  <p className="font-medium text-slate-200">
                    Hand #{round.id}: {round.bet} ({round.previousTotal} → {round.nextTotal})
                  </p>
                  <p className="text-xs text-slate-400">
                    {round.outcome.toUpperCase()} | Delta: {round.scoreDelta} | Score:{" "}
                    {round.scoreAfter}
                  </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
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
    </motion.div>
  );
}
