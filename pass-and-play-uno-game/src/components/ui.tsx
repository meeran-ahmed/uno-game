import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger" | "gold" | "cool";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_6px_0_#4c1d95,0_10px_22px_rgba(124,58,237,.45)] active:shadow-[0_2px_0_#4c1d95] active:translate-y-1",
  cool: "bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-[0_6px_0_#1e3a8a,0_10px_22px_rgba(37,99,235,.45)] active:shadow-[0_2px_0_#1e3a8a] active:translate-y-1",
  danger:
    "bg-gradient-to-b from-rose-400 to-rose-600 text-white shadow-[0_6px_0_#881337,0_10px_22px_rgba(244,63,94,.45)] active:shadow-[0_2px_0_#881337] active:translate-y-1",
  gold: "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_6px_0_#b45309,0_10px_22px_rgba(245,158,11,.45)] active:shadow-[0_2px_0_#b45309] active:translate-y-1",
  ghost:
    "bg-white/10 text-white/90 ring-1 ring-white/20 backdrop-blur hover:bg-white/20 active:translate-y-0.5",
};

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...rest
}: { children: ReactNode; variant?: Variant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`font-display inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm tracking-wide uppercase transition-all duration-100 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-[#151228]/80 p-5 shadow-[0_20px_60px_rgba(0,0,0,.55)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white/80 uppercase ring-1 ring-white/10 ${className}`}
    >
      {children}
    </span>
  );
}
