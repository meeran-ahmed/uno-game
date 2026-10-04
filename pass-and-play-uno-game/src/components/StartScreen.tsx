import { useState } from "react";
import { Btn, Panel } from "./ui";
import { HighScoreTable } from "./Overlays";
import { UnoCard } from "./UnoCard";
import type { ScoreEntry, Settings } from "../game/storage";
import { buildDeck } from "../game/cards";

const AVATARS = ["🦊", "🐼", "🐯", "🦄", "🐙", "🐸", "🦉", "🐝", "🦖", "🐨", "🦁", "🐳"];
const TARGETS = [200, 300, 500];

export interface Roster {
  names: string[];
  avatars: string[];
  bots: boolean[];
  count?: number;
}

export function StartScreen({
  settings,
  scores,
  onStart,
  onQuickPlay,
  onToggleSound,
  onHelp,
  onClearScores,
}: {
  settings: Settings;
  scores: ScoreEntry[];
  onQuickPlay: () => void;
  onStart: (roster: Roster, target: number, passScreens: boolean) => void;
  onToggleSound: () => void;
  onHelp: () => void;
  onClearScores: () => void;
}) {
  const [count, setCount] = useState(Math.max(2, Math.min(10, settings.names.length)));
  const [names, setNames] = useState<string[]>(settings.names);
  const [avatars, setAvatars] = useState<string[]>(settings.avatars);
  const [bots, setBots] = useState<boolean[]>(settings.bots);
  const [target, setTarget] = useState(settings.target);
  const [passScreens, setPassScreens] = useState(settings.passScreens);

  const deck = buildDeck().slice(0, 5);
  const setName = (i: number, v: string) =>
    setNames((n) => n.map((x, j) => (j === i ? v.slice(0, 10) : x)));
  const cycleAvatar = (i: number) =>
    setAvatars((a) => a.map((x, j) => (j === i ? AVATARS[(AVATARS.indexOf(x) + 1) % AVATARS.length] : x)));
  const toggleBot = (i: number) => setBots((b) => b.map((x, j) => (j === i ? !x : x)));

  const humanCount = bots.slice(0, count).filter((b) => !b).length;

  return (
    <div className="relative h-full w-full overflow-y-auto" style={bgStyle}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
        {/* hero */}
        <div className="relative text-center">
          <div className="pointer-events-none absolute -top-2 left-1/2 flex -translate-x-1/2 justify-center">
            {deck.map((c, i) => (
              <div
                key={c.id}
                className="animate-float"
                style={{ marginLeft: i === 0 ? 0 : -26, animationDelay: `${i * 0.18}s` }}
              >
                <div
                  style={{
                    transform: `rotate(${(i - 2) * 11}deg) translateY(${Math.abs(i - 2) * 6}px)`,
                  }}
                >
                  <UnoCard card={c} width={62} />
                </div>
              </div>
            ))}
          </div>
          <h1 className="font-display mt-20 text-5xl leading-none text-white drop-shadow-[0_6px_0_rgba(0,0,0,.35)] sm:text-6xl">
            <span className="bg-gradient-to-b from-rose-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              UNO
            </span>{" "}
            ROYALE
          </h1>
          <p className="font-display mt-1 text-[11px] tracking-[0.35em] text-violet-300/80 uppercase">
            10 players · one phone
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
            Pass-and-play party UNO. Everybody crowds around the screen, takes their turn, hands it
            on. Wilds, skips, reverses and UNO penalties included.
          </p>
        </div>

        {/* player count */}
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm tracking-widest text-white/70 uppercase">
              Players
            </h2>
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-200">
              {humanCount} human{humanCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`font-display h-11 w-11 rounded-2xl text-base transition-all ${
                  n === count
                    ? "scale-110 bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_4px_0_#4c1d95]"
                    : "bg-white/10 text-white/70 ring-1 ring-white/10 hover:bg-white/20"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-2xl bg-black/25 p-2 ring-1 ring-white/10"
              >
                <button
                  onClick={() => cycleAvatar(i)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xl transition-transform hover:scale-105 active:scale-95"
                  title="Change avatar"
                  aria-label={`Change avatar for player ${i + 1}`}
                >
                  {avatars[i]}
                </button>
                <input
                  value={names[i] ?? ""}
                  onChange={(e) => setName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="min-w-0 flex-1 rounded-xl bg-transparent px-1 text-sm font-semibold text-white outline-none placeholder:text-white/30"
                />
                <button
                  onClick={() => toggleBot(i)}
                  className={`h-8 shrink-0 rounded-lg px-2 text-[10px] font-bold tracking-wide uppercase transition-colors ${
                    bots[i]
                      ? "bg-emerald-400 text-emerald-950"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                  title="Toggle bot"
                  aria-pressed={bots[i]}
                  aria-label={`Player ${i + 1} is ${bots[i] ? "a bot" : "human"}`}
                >
                  {bots[i] ? "BOT" : "HUMAN"}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        {/* rules */}
        <Panel>
          <h2 className="font-display mb-3 text-sm tracking-widest text-white/70 uppercase">
            Match rules
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/50">First to</span>
            {TARGETS.map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`font-display rounded-xl px-4 py-2 text-sm transition-all ${
                  t === target
                    ? "bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow-[0_4px_0_#b45309]"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPassScreens((p) => !p)}
            className="flex w-full items-center justify-between rounded-2xl bg-black/25 p-3 text-left ring-1 ring-white/10"
          >
            <span>
              <span className="block text-sm font-semibold text-white">Privacy hand-off screens</span>
              <span className="block text-[11px] text-white/45">
                Hide your hand until the next player taps in
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                passScreens ? "bg-emerald-400" : "bg-white/20"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                  passScreens ? "left-6" : "left-1"
                }`}
              />
            </span>
          </button>
        </Panel>

        <div className="flex flex-col gap-2">
          <Btn
            variant="gold"
            className="w-full py-5 text-xl"
            onClick={() => onStart({ names, avatars, bots, count }, target, passScreens)}
          >
            ▶ Deal the cards
          </Btn>
          <button
            onClick={onQuickPlay}
            className="font-display w-full rounded-2xl bg-white/5 py-3 text-xs tracking-widest text-white/60 uppercase ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            ⚡ quick play · you vs 3 bots
          </button>
          <div className="flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={onToggleSound}>
              {settings.sound ? "🔊 Sound on" : "🔇 Sound off"}
            </Btn>
            <Btn variant="ghost" className="flex-1" onClick={onHelp}>
              ❔ How to play
            </Btn>
          </div>
        </div>

        <Panel>
          <HighScoreTable scores={scores} />
          {scores.length > 0 && (
            <button
              onClick={onClearScores}
              className="mt-3 w-full rounded-xl py-2 text-[11px] tracking-widest text-white/30 uppercase hover:text-rose-300"
            >
              clear hall of fame
            </button>
          )}
        </Panel>
        <p className="pb-2 text-center text-[10px] tracking-widest text-white/20 uppercase">
          keyboard: ← → pick · enter play · d draw · u uno · esc pause
        </p>
        <p className="pb-6 text-center text-xs text-white/40">
          <a href="https://vyonex.co.in" target="_blank" rel="noopener noreferrer" className="font-semibold text-rose-300/80 hover:text-rose-300 transition-colors">vyonex</a> first game<br/>
          created by <a href="https://meeran-portfolio.antideploy.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-300/80 hover:text-emerald-300 transition-colors">meeran ahmed</a>
        </p>
      </div>
    </div>
  );
}

export const bgStyle = {
  background:
    "radial-gradient(circle at 20% 10%, rgba(124,58,237,.35), transparent 45%), radial-gradient(circle at 85% 20%, rgba(236,72,153,.28), transparent 45%), radial-gradient(circle at 50% 100%, rgba(34,197,94,.18), transparent 55%), linear-gradient(180deg,#0b0918,#120c22 55%,#08060f)",
};
