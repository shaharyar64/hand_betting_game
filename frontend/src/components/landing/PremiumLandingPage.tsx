"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

import { gameApi } from "@/services/api";

type LeaderboardItem = {
  score: number;
  created_at: string;
};

export function PremiumLandingPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadLeaderboard() {
      try {
        const response = await gameApi.getLeaderboard();
        if (mounted) {
          setLeaderboard(response.data.top);
        }
      } catch {
        if (mounted) {
          setLeaderboard([]);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-slate-100 sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_35%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:p-12"
        >
          <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Hand Betting Game</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Premium Mahjong-Inspired
            <span className="bg-gradient-to-r from-sky-300 to-violet-300 bg-clip-text text-transparent">
              {" "}
              Betting Experience
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            Play strategic high/low rounds, track dynamic tile values, and climb the live
            leaderboard in a polished real-time interface.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/game"
              className="group inline-flex items-center rounded-xl bg-gradient-to-r from-sky-400 to-violet-500 px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_rgba(56,189,248,0.45)]"
            >
              New Game
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Leaderboard · Top 5</h2>
            <span className="text-xs uppercase tracking-wider text-slate-400">Live Preview</span>
          </div>

          <div className="space-y-3">
            {leaderboard.length > 0 ? (
              leaderboard.slice(0, 5).map((entry, index) => (
                <motion.div
                  key={`${entry.created_at}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 * index }}
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 transition hover:border-sky-300/40 hover:bg-slate-800/70"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-200">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-200">Player Score</span>
                  </div>
                  <span className="text-base font-semibold text-sky-300">{entry.score}</span>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/20 px-4 py-6 text-center text-sm text-slate-400">
                No scores yet. Start a new game and claim the top spot.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
