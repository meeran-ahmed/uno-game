import type { Player } from "../game/engine";

const AVATAR_COLORS = [
  "from-rose-400 to-rose-600",
  "from-amber-300 to-orange-500",
  "from-emerald-300 to-emerald-600",
  "from-sky-300 to-blue-600",
  "from-fuchsia-400 to-purple-600",
  "from-lime-300 to-green-600",
  "from-pink-400 to-rose-600",
  "from-cyan-300 to-teal-600",
  "from-indigo-300 to-indigo-600",
  "from-yellow-300 to-amber-600",
];

export function OpponentChip({
  player,
  active,
  index,
  compact,
}: {
  player: Player;
  active: boolean;
  index: number;
  compact: boolean;
}) {
  const cards = player.hand.length;
  const uno = cards === 1;
  return (
    <div
      className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${
        active ? "scale-110" : "scale-95 opacity-80"
      }`}
    >
      <div
        className={`relative grid place-items-center rounded-2xl bg-gradient-to-br ${
          AVATAR_COLORS[index % AVATAR_COLORS.length]
        } ${active ? "animate-chipPulse ring-4 ring-white/70" : "ring-2 ring-white/20"}`}
        style={{ width: compact ? 42 : 48, height: compact ? 42 : 48 }}
      >
        <span style={{ fontSize: compact ? 20 : 23 }} className="leading-none drop-shadow">
          {player.avatar}
        </span>
        <span
          className="font-display absolute -right-1.5 -bottom-1.5 grid place-items-center rounded-full bg-[#0d0b1a] px-1.5 text-[10px] text-white ring-2 ring-white/30"
          style={{ minWidth: 18 }}
        >
          {cards}
        </span>
      </div>
      <div className="max-w-[58px] truncate text-[10px] leading-none font-bold tracking-wide text-white/80">
        {player.name}
      </div>
      {uno && (
        <span
          className={`font-display absolute -top-2 left-1/2 -translate-x-1/2 rounded-md px-1 text-[9px] ${
            player.calledUno
              ? "bg-emerald-400 text-emerald-950"
              : "animate-bounce bg-amber-300 text-amber-950"
          }`}
        >
          UNO
        </span>
      )}
      {player.isBot && (
        <span className="absolute -top-1.5 right-0 text-[9px]" title="Bot">
          🤖
        </span>
      )}
    </div>
  );
}

export function OpponentRail({
  players,
  current,
  excludeId,
  compact,
}: {
  players: Player[];
  current: number;
  excludeId: number;
  compact: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3">
      {players.map((p, i) =>
        p.id === excludeId ? null : (
          <OpponentChip key={p.id} player={p} index={i} active={i === current} compact={compact} />
        ),
      )}
    </div>
  );
}

export function ScoreStrip({
  players,
  target,
  current,
}: {
  players: Player[];
  target: number;
  current: number;
}) {
  if (!players.length) return null;
  const leader = players.reduce((a, b) => (b.score > a.score ? b : a), players[0]);
  return (
    <div className="flex items-center gap-2 overflow-x-auto px-2 py-1 text-[10px] whitespace-nowrap">
      <span className="font-display shrink-0 rounded bg-white/10 px-2 py-1 text-white/70">
        🎯 {target}
      </span>
      {players.map((p) => (
        <span
          key={p.id}
          className={`shrink-0 rounded-full px-2 py-1 font-bold tabular-nums transition-all ${
            p.id === current
              ? "bg-white text-slate-900"
              : p.id === leader.id
                ? "bg-amber-300/20 text-amber-200 ring-1 ring-amber-300/40"
                : "bg-white/5 text-white/60"
          }`}
        >
          {p.avatar} {p.name} {p.score}
        </span>
      ))}
    </div>
  );
}
