import { useEffect, useRef, useState } from "react";
import { COLORS, COLOR_HEX } from "../game/cards";
import type { GameState, Player, RoundResult } from "../game/engine";
import type { ScoreEntry } from "../game/storage";
import { Btn, Panel } from "./ui";

function Scrim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`animate-fadeIn fixed inset-0 z-40 flex items-center justify-center bg-[#07061a]/80 px-4 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------- pass phone ------------------------------- */

export function PassScreen({
  player,
  game,
  onReady,
}: {
  player: Player;
  game: GameState;
  onReady: () => void;
}) {
  return (
    <div
      onClick={onReady}
      role="button"
      aria-label={`Start ${player.name}'s turn`}
      className="fixed inset-0 z-40 cursor-pointer overflow-hidden bg-[#08061a] px-6"
    >
      {/* content fades in, but the background is opaque immediately so no
          previous hand is ever visible through the hand-off screen */}
      <div className="animate-fadeIn relative flex h-full flex-col items-center justify-center gap-4 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(139,92,246,.35), transparent 60%), radial-gradient(circle at 20% 80%, rgba(236,72,153,.22), transparent 55%)",
        }}
      />
      <p className="font-display relative text-[11px] tracking-[0.45em] text-violet-300/80">
        PASS THE PHONE
      </p>
      <div className="animate-float relative text-7xl drop-shadow-[0_10px_25px_rgba(139,92,246,.5)]">
        {player.avatar}
      </div>
      <h2 className="font-display relative text-4xl text-white sm:text-5xl">{player.name}</h2>
      <div className="relative flex items-center gap-2 text-xs text-white/60">
        <span className="rounded-full bg-white/10 px-3 py-1">Round {game.round}</span>
        <span className="rounded-full bg-white/10 px-3 py-1">{player.hand.length} cards</span>
        <span className="rounded-full bg-white/10 px-3 py-1">{player.score} pts</span>
      </div>
      {game.pendingDraw > 0 ? (
        <div className="animate-bounce relative rounded-2xl bg-rose-500/90 px-5 py-3 text-white shadow-xl">
          <span className="font-display text-lg">⚠︎ DRAW {game.pendingDraw} CARDS</span>
          <div className="text-[11px] opacity-90">your turn is skipped</div>
        </div>
      ) : (
        <div className="relative text-xs text-white/40">It&apos;s your turn — {game.log[0]?.text}</div>
      )}
      <div className="font-display relative mt-2 rounded-2xl bg-gradient-to-b from-violet-400 to-violet-600 px-8 py-4 text-base text-white uppercase shadow-[0_6px_0_#4c1d95]">
        Tap to start
      </div>
      <p className="relative text-[10px] tracking-widest text-white/25 uppercase">
        everyone else, look away 👀
      </p>
      </div>
    </div>
  );
}

/* --------------------------------- uno call -------------------------------- */

export function UnoPrompt({
  player,
  deadline,
  total,
  onCall,
  onMiss,
}: {
  player: Player;
  /** epoch ms when the call window closes — survives pause/help remounts */
  deadline: number;
  total: number;
  onCall: () => void;
  onMiss: () => void;
}) {
  const [left, setLeft] = useState(() => Math.max(0, deadline - Date.now()));
  const missRef = useRef(onMiss);
  missRef.current = onMiss;
  useEffect(() => {
    let raf = 0;
    let fired = false;
    const loop = () => {
      const remain = Math.max(0, deadline - Date.now());
      setLeft(remain);
      if (remain <= 0) {
        if (!fired) {
          fired = true;
          missRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [deadline]);

  const pct = left / total;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <Scrim>
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="relative grid place-items-center">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="10" />
            <circle
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={pct > 0.4 ? "#facc15" : "#f43f5e"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
            />
          </svg>
          <span className="font-display absolute text-3xl text-white tabular-nums">
            {(left / 1000).toFixed(1)}
          </span>
        </div>
        <h2 className="font-display text-3xl text-amber-300 drop-shadow-[0_0_18px_rgba(250,204,21,.6)]">
          ONE CARD LEFT!
        </h2>
        <p className="text-sm text-white/70">
          {player.name}, shout it before the timer runs out or pick up 2.
        </p>
        <div className="flex gap-3">
          <Btn variant="gold" className="px-8 py-4 text-lg" onClick={onCall} autoFocus>
            UNO! 📣
          </Btn>
          <Btn variant="ghost" onClick={onMiss}>
            pass
          </Btn>
        </div>
        <p className="text-[10px] tracking-widest text-white/30 uppercase">press U for uno</p>
      </div>
    </Scrim>
  );
}

/* ------------------------------- colour picker ----------------------------- */

export function ColorPicker({ onPick }: { onPick: (c: (typeof COLORS)[number]) => void }) {
  const names = ["Red", "Yellow", "Green", "Blue"] as const;
  return (
    <Scrim>
      <div className="w-full max-w-md text-center">
        <h2 className="font-display mb-1 text-2xl text-white">PICK A COLOUR</h2>
        <p className="mb-5 text-xs text-white/50">the next player must match it</p>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.map((c, i) => (
            <button
              key={c}
              onClick={() => onPick(c)}
              className="group relative h-24 overflow-hidden rounded-3xl ring-2 ring-white/25 transition-all duration-150 hover:scale-[1.04] active:scale-95"
              style={{
                background: `linear-gradient(150deg, ${COLOR_HEX[c]}, rgba(0,0,0,.55))`,
                boxShadow: `0 10px 30px ${COLOR_HEX[c]}55`,
              }}
            >
              <span className="font-display text-2xl text-white drop-shadow-lg">{names[i]}</span>
              <span className="absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/15" />
              <span className="font-display absolute bottom-1 right-2 text-[10px] text-white/50">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      </div>
    </Scrim>
  );
}

/* --------------------------------- penalty --------------------------------- */

export function PenaltyPrompt({
  game,
  player,
  onTake,
}: {
  game: GameState;
  player: Player;
  onTake: () => void;
}) {
  const by = game.players[game.lastPlayedBy ?? 0];
  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-[#12030c] px-6">
      <div className="animate-fadeIn relative flex h-full flex-col items-center justify-center gap-4 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: "radial-gradient(circle at 50% 35%, rgba(244,63,94,.35), transparent 60%)",
        }}
      />
      <p className="font-display relative text-[11px] tracking-[0.45em] text-rose-300/80">
        PASS THE PHONE
      </p>
      <div className="animate-float relative text-6xl">{player.avatar}</div>
      <h2 className="font-display relative text-3xl text-white sm:text-4xl">{player.name}</h2>
      <div className="animate-shakeSlow relative rounded-3xl bg-rose-500/90 px-6 py-4 shadow-[0_10px_40px_rgba(244,63,94,.5)]">
        <div className="font-display text-4xl text-white drop-shadow">DRAW {game.pendingDraw}</div>
        <div className="text-[11px] text-white/90">
          {by?.name ?? "Someone"} hit you · your turn is skipped
        </div>
      </div>
      <Btn variant="danger" className="relative mt-1 px-8 py-4 text-lg" onClick={onTake} autoFocus>
        Take {game.pendingDraw} cards
      </Btn>
      </div>
    </div>
  );
}

/* ------------------------------ round summary ------------------------------ */

export function RoundEndScreen({
  game,
  result,
  onNext,
}: {
  game: GameState;
  result: RoundResult;
  onNext: () => void;
}) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <Scrim>
      <Panel className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="animate-bounceIn text-5xl">🏆</div>
          <h2 className="font-display text-3xl text-amber-300">{result.winnerName} won!</h2>
          <p className="text-sm text-white/60">
            Round {game.round} · +{result.gained} points · first to {game.target}
          </p>
        </div>
        <div className="mb-4 max-h-[34vh] space-y-1.5 overflow-y-auto pr-1">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                i === 0 ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "bg-white/5"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-white/50">{i + 1}</span>
              <span className="text-lg">{p.avatar}</span>
              <span className="flex-1 truncate text-sm font-semibold text-white/90">{p.name}</span>
              <span className="text-xs text-white/40">
                {result.hands.find((h) => h.id === p.id)?.cards ?? 0} cards
              </span>
              <span className="font-display w-12 text-right text-sm text-white tabular-nums">
                {p.score}
              </span>
            </div>
          ))}
        </div>
        <Btn variant="primary" className="w-full py-4 text-base" onClick={onNext} autoFocus>
          Deal round {game.round + 1}
        </Btn>
      </Panel>
    </Scrim>
  );
}

/* -------------------------------- match over ------------------------------- */

export function MatchEndScreen({
  game,
  scores,
  onRestart,
  onMenu,
}: {
  game: GameState;
  scores: ScoreEntry[];
  onRestart: () => void;
  onMenu: () => void;
}) {
  const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <Scrim>
      <Panel className="max-h-[92vh] w-full max-w-md overflow-y-auto">
        <div className="mb-4 text-center">
          <div className="animate-bounceIn text-6xl">👑</div>
          <h2 className="font-display text-4xl text-amber-300 drop-shadow">{winner.name}</h2>
          <p className="font-display text-sm tracking-widest text-white/60 uppercase">
            champion · {winner.score} pts
          </p>
        </div>
        <div className="mb-4 space-y-1.5">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                i === 0 ? "bg-amber-300/15 ring-1 ring-amber-300/40" : "bg-white/5"
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-white/50">{i + 1}</span>
              <span className="text-lg">{p.avatar}</span>
              <span className="flex-1 truncate text-sm font-semibold text-white/90">{p.name}</span>
              <span className="text-[10px] text-white/40">{p.roundsWon}R</span>
              <span className="font-display w-12 text-right text-sm text-white tabular-nums">
                {p.score}
              </span>
            </div>
          ))}
        </div>
        <HighScoreTable scores={scores} compact />
        <div className="mt-4 flex gap-2">
          <Btn variant="primary" className="flex-1" onClick={onRestart} autoFocus>
            Rematch
          </Btn>
          <Btn variant="ghost" onClick={onMenu}>
            Menu
          </Btn>
        </div>
      </Panel>
    </Scrim>
  );
}

export function HighScoreTable({
  scores,
  compact,
}: {
  scores: ScoreEntry[];
  compact?: boolean;
}) {
  if (scores.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-xs text-white/40">
        No hall-of-fame entries yet — win a match to claim the top spot.
      </div>
    );
  return (
    <div className="rounded-2xl bg-black/30 p-3">
      <div className="font-display mb-2 flex items-center justify-between text-[11px] tracking-widest text-white/50 uppercase">
        <span>🏅 Hall of fame</span>
        {!compact && <span className="text-white/30">top {scores.length}</span>}
      </div>
      <div className={`space-y-1 ${compact ? "max-h-32" : "max-h-[40vh]"} overflow-y-auto`}>
        {scores.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs odd:bg-white/5">
            <span className="w-4 text-white/40">{i + 1}</span>
            <span>{s.avatar}</span>
            <span className="flex-1 truncate font-semibold text-white/85">{s.name}</span>
            <span className="text-[10px] text-white/35">{s.players}P</span>
            <span className="text-[10px] text-white/35">{s.rounds}R</span>
            <span className="font-display w-10 text-right text-amber-200 tabular-nums">
              {s.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- pause ---------------------------------- */

export function PauseScreen({
  onResume,
  onRestart,
  onMenu,
  sound,
  onToggleSound,
  onHelp,
}: {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  sound: boolean;
  onToggleSound: () => void;
  onHelp: () => void;
}) {
  return (
    <Scrim>
      <Panel className="w-full max-w-xs text-center">
        <h2 className="font-display mb-4 text-3xl text-white">PAUSED</h2>
        <div className="flex flex-col gap-2">
          <Btn variant="primary" className="py-4" onClick={onResume} autoFocus>
            ▶ Resume
          </Btn>
          <Btn variant="ghost" onClick={onToggleSound}>
            {sound ? "🔊 Sound on" : "🔇 Sound off"}
          </Btn>
          <Btn variant="ghost" onClick={onHelp}>
            ❔ How to play
          </Btn>
          <Btn variant="cool" onClick={onRestart}>
            ↻ Restart match
          </Btn>
          <Btn variant="danger" onClick={onMenu}>
            ⏏ Quit to menu
          </Btn>
        </div>
      </Panel>
    </Scrim>
  );
}

export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <Scrim className="z-50">
      <Panel className="max-h-[90vh] w-full max-w-md overflow-y-auto">
        <h2 className="font-display mb-3 text-2xl text-white">HOW TO PLAY</h2>
        <ul className="space-y-2 text-sm text-white/75">
          <li>
            <b className="text-white">Goal:</b> be first to empty your hand. Points from everyone
            else&apos;s cards go to the round winner. First to the target score wins the match.
          </li>
          <li>
            <b className="text-white">Match</b> the top card by colour, number or symbol. Wilds go
            on anything.
          </li>
          <li>
            <b className="text-white">Can&apos;t play?</b> Tap the deck to draw one card. If it
            plays you may throw it down immediately.
          </li>
          <li>
            <b className="text-white">⦸ Skip</b> jumps the next player, <b className="text-white">⇄ Reverse</b>{" "}
            flips the turn order, <b className="text-white">+2 / +4</b> forces cards and a lost turn.
          </li>
          <li>
            <b className="text-white">UNO!</b> When you drop to one card you have a few seconds to
            call it, or draw 2 as a penalty.
          </li>
          <li className="pt-2 text-xs text-white/50">
            <b className="text-white/80">Keyboard:</b> ←/→ pick card · Enter or Space to play · D
            draws · U calls UNO · Esc pauses
          </li>
        </ul>
        <Btn className="mt-4 w-full" onClick={onClose} autoFocus>
          Got it
        </Btn>
      </Panel>
    </Scrim>
  );
}
