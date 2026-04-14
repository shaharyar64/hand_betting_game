"use client";

import { motion } from "framer-motion";

type TileCardProps = {
  label: string;
  value: number | null;
  accentClassName?: string;
};

export function TileCard({ label, value, accentClassName = "" }: TileCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-2xl border border-[#d9c39a] bg-gradient-to-b from-[#fff5db] to-[#f3e1b5] p-5 text-[#3f2d11] shadow-[0_8px_20px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_26px_rgba(0,0,0,0.32)] ${accentClassName}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#eab308] via-[#f59e0b] to-[#f97316]" />
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#7a5a22]">Mahjong Tile</p>
      <p className="mt-3 text-lg font-semibold">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "-"}</p>
    </motion.article>
  );
}
