"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";

import { useGameStore } from "@/store/gameStore";
import { TileCard } from "./TileCard";

const GAME_OVER_REASON_LABELS: Record<string, string> = {
  terminal_tile_or_reshuffle_limit:
    "A special tile hit its terminal value (0 or 10), or the draw pile exhausted for the 3rd time.",
  draw_unavailable_or_max_reshuffles:
    "No more tiles can be drawn because the reshuffle limit has been reached.",
};

const GAME_STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  awaiting_bet: "Awaiting",
  resolved: "Resolved",
  game_over: "Game over",
};

const GAME_STATUS_BADGE_CLASS: Record<string, string> = {
  idle: "border border-slate-600 bg-slate-800 text-slate-200",
  awaiting_bet: "border border-cyan-600/50 bg-cyan-950/80 text-cyan-100",
  resolved: "border border-amber-600/40 bg-amber-950/70 text-amber-100",
  game_over: "border border-rose-600/40 bg-rose-950/70 text-rose-100",
};

function GameStatusStatCard({ rawStatus, displayLabel }: { rawStatus: string; displayLabel: string }) {
  const badgeClass =
    GAME_STATUS_BADGE_CLASS[rawStatus] ?? "border border-slate-600 bg-slate-800 text-slate-200";

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Game Status</p>
      <div className="mt-2 flex min-h-[2rem] items-center">
        <span
          className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold tracking-tight ${badgeClass}`}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const isLongTextValue = typeof value === "string" && value.length > 10;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p
        className={`mt-2 font-semibold text-slate-100 ${
          isLongTextValue ? "break-words text-lg leading-tight" : "text-xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function GameDashboard() {
  const score = useGameStore((state) => state.score);
  const gameStatus = useGameStore((state) => state.gameStatus);
  const hand = useGameStore((state) => state.hand);
  const tiles = useGameStore((state) => state.tiles);
  const history = useGameStore((state) => state.history);
  const leaderboard = useGameStore((state) => state.leaderboard);
  const gameOverReason = useGameStore((state) => state.gameOverReason);
  const drawPileCount = useGameStore((state) => state.drawPileCount);
  const discardPileCount = useGameStore((state) => state.discardPileCount);
  const reshuffleCount = useGameStore((state) => state.reshuffleCount);
  const loading = useGameStore((state) => state.loading);
  const error = useGameStore((state) => state.error);
  const drawAnimationKey = useGameStore((state) => state.drawAnimationKey);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const placeBet = useGameStore((state) => state.placeBet);

  const currentHandValue = (hand.anchor_value ?? 0) + (hand.active_value ?? 0);
  const latestOutcome = history[0]?.outcome ?? null;
  const tileResultState =
    gameStatus === "awaiting_bet" || gameStatus === "resolved" ? latestOutcome : null;
  const gameIsOver = gameStatus === "game_over";
  const gameOverSummary = gameOverReason
    ? (GAME_OVER_REASON_LABELS[gameOverReason] ?? gameOverReason)
    : "A game-over condition was reached.";
  const gameStatusLabel = GAME_STATUS_LABELS[gameStatus] ?? gameStatus.replaceAll("_", " ");

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
        className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30"
      >
        <h1 className="text-3xl font-bold tracking-tight text-white">Hand Betting Game</h1>
        <p className="mt-2 text-sm text-slate-300">
          Place your bet, draw a new tile, and outscore the table.
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-slate-500 px-3 py-2 text-xs font-medium text-slate-100 transition hover:bg-slate-800"
          >
            Exit to Landing
          </Link>
        </div>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Score" value={score} />
        <StatCard label="Current Hand Value" value={currentHandValue} />
        <GameStatusStatCard rawStatus={gameStatus} displayLabel={gameStatusLabel} />
        <StatCard label="Hands Played" value={history.length} />
        <StatCard label="Draw Pile" value={drawPileCount} />
        <StatCard label="Discard Pile" value={discardPileCount} />
        <StatCard label="Reshuffles" value={`${reshuffleCount}/3`} />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 330, damping: 24 }}
        className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30"
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
              label={tiles[0]?.label ?? hand.anchor_label ?? "Anchor"}
              value={tiles[0]?.value ?? hand.anchor_value}
              type={tiles[0]?.type}
              resultState={tileResultState}
              accentClassName="ring-1 ring-white/10"
            />
            <TileCard
              label={tiles[1]?.label ?? hand.active_label ?? "Active"}
              value={tiles[1]?.value ?? hand.active_value}
              type={tiles[1]?.type}
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
            disabled={loading || gameIsOver}
            className="rounded-lg border border-emerald-300 bg-emerald-400 px-4 py-2 text-sm font-medium text-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Bet Higher
          </motion.button>
          <motion.button
            whileHover={{ filter: "brightness(1.06)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
            type="button"
            onClick={() => void placeBet("lower")}
            disabled={loading || gameIsOver}
            className="rounded-lg border border-rose-300 bg-rose-400 px-4 py-2 text-sm font-medium text-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="rounded-lg border border-slate-500 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            New Game
          </motion.button>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">History</h3>
              <p className="mt-1 text-xs text-slate-400">
                Previous Total = Anchor + Active, Next Total = Active + Drawn
              </p>
            </div>
          </div>
          {history.length > 0 ? (
            <motion.div
              layout
              className="history-scroll mt-3 max-h-72 space-y-2 overflow-auto pr-2 text-sm"
            >
              <AnimatePresence initial={false}>
                {history.map((round) => (
                  <motion.div
                    key={round.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ type: "spring", stiffness: 360, damping: 25 }}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-100">Hand #{round.id}</p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          round.outcome === "win"
                            ? "bg-emerald-900/60 text-emerald-200"
                            : "bg-rose-900/60 text-rose-200"
                        }`}
                      >
                        {round.outcome.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      Bet:{" "}
                      <span className="font-semibold text-slate-100">
                        {round.bet === "higher" ? "Higher" : "Lower"}
                      </span>{" "}
                      | Totals:{" "}
                      <span className="font-semibold text-slate-100">
                        {round.previousTotal} → {round.nextTotal}
                      </span>{" "}
                      | Score Delta:{" "}
                      <span className="font-semibold text-slate-100">{round.scoreDelta}</span> |
                      Score After:{" "}
                      <span className="font-semibold text-slate-100">{round.scoreAfter}</span>
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                          Anchor
                        </p>
                        <TileCard
                          label={round.tiles.anchor.label}
                          value={round.tiles.anchor.value}
                          type={round.tiles.anchor.type}
                          accentClassName="scale-[0.94]"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                          Active
                        </p>
                        <TileCard
                          label={round.tiles.active.label}
                          value={round.tiles.active.value}
                          type={round.tiles.active.type}
                          accentClassName="scale-[0.94]"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">
                          Drawn
                        </p>
                        <TileCard
                          label={round.tiles.drawn.label}
                          value={round.tiles.drawn.value}
                          type={round.tiles.drawn.type}
                          accentClassName="scale-[0.94]"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No resolved hands yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/30">
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
        <p className="rounded-lg border border-rose-400/60 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {gameIsOver ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-2xl border border-amber-300/50 bg-amber-950/60 p-6"
        >
          <h3 className="text-xl font-semibold text-amber-200">Game Over</h3>
          <p className="mt-2 text-sm text-amber-100">
            Final Score: <span className="font-semibold">{score}</span>
          </p>
          <p className="mt-1 text-xs text-amber-200/90">
            Reason: {gameOverSummary}
          </p>
          <div className="mt-4 flex gap-3">
            <motion.button
              whileHover={{ filter: "brightness(1.06)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 520, damping: 28, mass: 0.6 }}
              type="button"
              onClick={() => void startNewGame()}
              className="rounded-lg border border-amber-200 bg-amber-300 px-4 py-2 text-sm font-semibold text-amber-950"
            >
              Play Again
            </motion.button>
            <Link
              href="/"
              className="inline-flex items-center rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
            >
              Back to Landing
            </Link>
          </div>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
