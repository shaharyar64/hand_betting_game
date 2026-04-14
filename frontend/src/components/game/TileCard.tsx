"use client";

import { motion } from "framer-motion";

type TileCardProps = {
  label: string;
  value: number | null;
  resultState?: "win" | "lose" | null;
  accentClassName?: string;
};

const tileVariants = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 380,
      damping: 24,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.14 },
  },
};

const hoverAnimation = {
  y: -4,
  boxShadow: "0 16px 28px rgba(0,0,0,0.28)",
  transition: { type: "spring", stiffness: 450, damping: 26, mass: 0.65 },
};

export function TileCard({
  label,
  value,
  resultState = null,
  accentClassName = "",
}: TileCardProps) {
  const glowShadow =
    resultState === "win"
      ? "0 0 0 1px rgba(74, 222, 128, 0.45), 0 8px 22px rgba(34, 197, 94, 0.22)"
      : resultState === "lose"
        ? "0 0 0 1px rgba(251, 113, 133, 0.45), 0 8px 22px rgba(244, 63, 94, 0.2)"
        : "0 8px 20px rgba(0,0,0,0.25)";

  return (
    <motion.article
      variants={tileVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      whileHover={hoverAnimation}
      className={`group relative overflow-hidden rounded-2xl border border-[#d9c39a] bg-gradient-to-b from-[#fff5db] to-[#f3e1b5] p-5 text-[#3f2d11] shadow-[0_8px_20px_rgba(0,0,0,0.25)] ${accentClassName}`}
      style={{ boxShadow: glowShadow }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#f97316]" />
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7a5a22]">Mahjong Tile</p>
      <p className="mt-3 text-lg font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "-"}</p>
    </motion.article>
  );
}
