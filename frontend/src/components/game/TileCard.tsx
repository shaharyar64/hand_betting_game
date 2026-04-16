"use client";

/** Animated visual card for displaying a Mahjong tile and value. */
import { motion, type Variants } from "framer-motion";

type TileCardProps = {
  label: string;
  value: number | null;
  type?: string;
  resultState?: "win" | "lose" | null;
  accentClassName?: string;
};

function getTilePalette(tileType: string | undefined, label: string) {
  /** Resolve tile color palette by tile type and label. */
  const normalizedLabel = label.trim().toLowerCase();
  const normalizedType = (tileType ?? "").trim().toLowerCase();

  if (normalizedType === "dragon" && normalizedLabel === "red") {
    return {
      topBarClassName: "bg-rose-500",
      typeClassName: "text-rose-700",
      labelClassName: "text-rose-950",
      borderClassName: "border-rose-300",
      backgroundClassName: "bg-rose-50",
    };
  }
  if (normalizedType === "dragon" && normalizedLabel === "green") {
    return {
      topBarClassName: "bg-emerald-500",
      typeClassName: "text-emerald-700",
      labelClassName: "text-emerald-950",
      borderClassName: "border-emerald-300",
      backgroundClassName: "bg-emerald-50",
    };
  }
  if (normalizedType === "dragon" && normalizedLabel === "white") {
    return {
      topBarClassName: "bg-zinc-500",
      typeClassName: "text-zinc-700",
      labelClassName: "text-zinc-900",
      borderClassName: "border-zinc-300",
      backgroundClassName: "bg-zinc-50",
    };
  }
  if (normalizedType === "wind" || ["e", "w", "n", "s"].includes(normalizedLabel)) {
    return {
      topBarClassName: "bg-cyan-600",
      typeClassName: "text-cyan-700",
      labelClassName: "text-cyan-950",
      borderClassName: "border-cyan-300",
      backgroundClassName: "bg-cyan-50",
    };
  }
  return {
    topBarClassName: "bg-amber-400",
    typeClassName: "text-amber-700",
    labelClassName: "text-amber-950",
    borderClassName: "border-amber-300",
    backgroundClassName: "bg-amber-50",
  };
}

const tileVariants: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
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
  transition: { type: "spring" as const, stiffness: 450, damping: 26, mass: 0.65 },
};

export function TileCard({
  label,
  value,
  type,
  resultState = null,
  accentClassName = "",
}: TileCardProps) {
  /** Render one tile card with outcome glow and hover animation. */
  const tilePalette = getTilePalette(type, label);
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
      className={`group relative overflow-hidden rounded-2xl border p-5 text-amber-950 shadow-[0_8px_20px_rgba(0,0,0,0.25)] ${tilePalette.borderClassName} ${tilePalette.backgroundClassName} ${accentClassName}`}
      style={{ boxShadow: glowShadow }}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${tilePalette.topBarClassName}`} />
      <p className={`text-[11px] uppercase tracking-[0.18em] ${tilePalette.typeClassName}`}>
        Mahjong Tile
      </p>
      <p className={`mt-3 text-lg font-semibold ${tilePalette.labelClassName}`}>{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? "-"}</p>
    </motion.article>
  );
}
