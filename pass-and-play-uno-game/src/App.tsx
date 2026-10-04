import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { canPlay, topCard, type Card, type Color } from "./game/cards";
import { emptyState, reducer, type GameState } from "./game/engine";
import { fx, haptic, sfx } from "./fx";
import { flyBack, flyClone } from "./fx/fly";
import { OpponentRail, ScoreStrip } from "./components/OpponentRail";
import { TableCenter } from "./components/TableCenter";
import { HandArea } from "./components/HandArea";
import { StartScreen, type Roster } from "./components/StartScreen";
import {
  ColorPicker,
  HelpScreen,
  MatchEndScreen,
  PassScreen,
  PauseScreen,
  PenaltyPrompt,
  RoundEndScreen,
  UnoPrompt,
} from "./components/Overlays";
import { Btn } from "./components/ui";
import { UnoCard } from "./components/UnoCard";
import {
  clearScores,
  loadScores,
  loadSettings,
  saveScore,
  saveSettings,
  type ScoreEntry,
  type Settings,
} from "./game/storage";

const CONFETTI = ["#f4354f", "#f5b301", "#22c55e", "#2b7fff", "#ffffff"];
const UNO_MS = 4200;

export default function App() {
  const [screen, setScreen] = useState<"menu" | "game">("menu");
  const [game, dispatch] = useReducer(reducer, undefined, emptyState);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string; color: string } | null>(null);
  const [flash, setFlash] = useState<{ id: number; color: string } | null>(null);
  const [hint, setHint] = useState(false);
  const hintShownRef = useRef(false);
  const [vw, setVw] = useState(() => (typeof window === "undefined" ? 400 : window.innerWidth));

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const discardRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLButtonElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const matchStartRef = useRef(0);
  const setupRef = useRef<{ roster: Roster; target: number; passScreens: boolean } | null>(null);
  const savedRef = useRef(false);
  /** Rate-limit identical rapid taps so one click = one action. */
  const actionLockRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  /** UNO call deadline (epoch ms) — survives pause/help so the timer can't be reset. */
  const unoDeadlineRef = useRef<number | null>(null);
  const pausedAtRef = useRef(0);

  const me = game.players[game.current];
  const human = me && !me.isBot;
  const compact = vw < 470;
  const handCount = me?.hand.length ?? 0;

  const cardWidth = useMemo(() => {
    const maxCards = vw < 400 ? 4.3 : vw < 768 ? 6 : 8;
    const max = vw < 768 ? 82 : 100;
    return Math.round(Math.max(44, Math.min(max, (vw - 56) / Math.max(1, Math.min(handCount, maxCards)))));
  }, [vw, handCount]);

  /* ------------------------------- mount fx ------------------------------- */
  useEffect(() => {
    const c = canvasRef.current;
    const r = rootRef.current;
    if (!c || !r) return;
    fx.mount(c, r);
    const unlock = () => sfx.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => {
      fx.unmount();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    sfx.enabled = settings.sound;
  }, [settings.sound]);

  /* --------------------------- fx event reactions -------------------------- */
  useEffect(() => {
    const e = game.fxEvent;
    if (!e) return;
    const r = discardRef.current?.getBoundingClientRect();
    const cx = r ? r.left + r.width / 2 : window.innerWidth / 2;
    const cy = r ? r.top + r.height / 2 : window.innerHeight / 2;
    switch (e.kind) {
      case "play":
        sfx.play("play");
        fx.burst(cx, cy, [e.color, "#ffffff"], 16, 0.8);
        fx.shake(4, 170);
        haptic(12);
        break;
      case "skip":
        sfx.play("skip");
        fx.burst(cx, cy, [e.color, "#ffffff"], 30, 1.3);
        fx.shake(11, 330);
        haptic([0, 25, 45, 25]);
        break;
      case "reverse":
        sfx.play("reverse");
        fx.burst(cx - 90, cy, [e.color, "#ffffff"], 18, 1.1);
        fx.burst(cx + 90, cy, [e.color, "#ffffff"], 18, 1.1);
        fx.shake(9, 300);
        haptic([0, 20, 40, 20]);
        break;
      case "draw":
        sfx.play("penalty");
        fx.burst(cx, cy, [e.color, "#ffffff", "#f43f5e"], 34, 1.3);
        fx.shake(14, 420);
        haptic([0, 45, 70, 70]);
        break;
      case "wild":
        sfx.play("wild");
        fx.burst(cx, cy, CONFETTI, 48, 1.5);
        fx.shake(9, 300);
        haptic([0, 15, 40, 15]);
        break;
      case "uno":
        sfx.play("uno");
        fx.fountain(cx, cy, ["#facc15", "#ffffff"], 46);
        fx.shake(8, 280);
        haptic([0, 20, 50, 20, 50, 20]);
        break;
      case "penalty":
        sfx.play("penalty");
        fx.burst(cx, cy, ["#f43f5e", "#ffffff"], 26, 1.2);
        fx.shake(15, 440);
        haptic([0, 60, 60, 60]);
        break;
      case "round":
        sfx.play("win");
        fx.rain(CONFETTI, 80);
        fx.shake(10, 400);
        haptic([0, 30, 60, 30, 60, 60]);
        break;
      case "win":
        sfx.play("win");
        fx.rain(CONFETTI, 140);
        fx.fountain(cx, cy, CONFETTI, 60);
        fx.shake(16, 700);
        haptic([0, 40, 60, 40, 60, 40, 60, 120]);
        break;
    }
    if (e.text) setBanner({ id: e.id, text: e.text, color: e.color });
    setFlash({ id: e.id, color: e.color });
  }, [game.fxEvent]);

  /* ------------------------------- bot driver ------------------------------ */
  useEffect(() => {
    if (screen !== "game" || paused || help) return;
    const p = game.players[game.current];
    if (!p) return;
    if (game.phase === "pass") {
      if (p.isBot || !game.passScreens) {
        const t = setTimeout(() => dispatch({ type: "BEGIN_TURN" }), p.isBot ? 420 : 80);
        return () => clearTimeout(t);
      }
      return;
    }
    if (!p.isBot) return;
    if (!["play", "drawn", "penalty", "uno", "color"].includes(game.phase)) return;
    const t = setTimeout(
      () => dispatch({ type: "BOT_MOVE", pick: 0 }),
      520 + Math.random() * 520,
    );
    return () => clearTimeout(t);
  }, [game, screen, paused, help]);

  /* ----------------------------- selection sync ---------------------------- */
  useEffect(() => {
    const hand = game.players[game.current]?.hand ?? [];
    if (!hand.length) return;
    const top = game.discard.length ? topCard(game.discard) : null;
    let idx = top
      ? hand.findIndex((c) => canPlay(c, top, game.activeColor, game.pendingDraw, hand))
      : 0;
    if (idx < 0) idx = 0;
    setSelectedIdx(idx);
  }, [game.current, game.phase, game.round, game.drawnCardId]);

  useEffect(() => {
    if (selectedIdx < 0) return;
    const el = handRef.current?.querySelector(`[data-card-id]`);
    if (el instanceof HTMLElement) {
      const target = el.parentElement?.children[selectedIdx];
      if (target instanceof HTMLElement) target.scrollIntoView({ block: "nearest", inline: "center" });
    }
  }, [selectedIdx]);

  /* ------------------------------ turn changes ----------------------------- */
  useEffect(() => {
    if (screen !== "game") return;
    if (game.phase === "pass") sfx.play("deal");
  }, [game.current, game.phase, screen]);

  /* ---------------------------- UNO deadline ------------------------------- */
  useEffect(() => {
    if (game.phase === "uno" && human) {
      if (unoDeadlineRef.current === null) {
        unoDeadlineRef.current = Date.now() + UNO_MS;
      }
    } else {
      unoDeadlineRef.current = null;
    }
  }, [game.phase, human]);

  /* ------------------------------ first hint ------------------------------- */
  useEffect(() => {
    if (screen !== "game" || paused || help) return;
    if (game.phase === "play" && human && !hintShownRef.current) {
      hintShownRef.current = true;
      setHint(true);
      const t = window.setTimeout(() => setHint(false), 7000);
      return () => clearTimeout(t);
    }
  }, [game.phase, human, screen, paused, help]);

  /* --------------------------- high score saving --------------------------- */
  useEffect(() => {
    if (screen !== "game") return;
    if (game.phase === "matchEnd") {
      if (!savedRef.current && game.players.length) {
        savedRef.current = true;
        const winner = [...game.players].sort((a, b) => b.score - a.score)[0];
        setScores(
          saveScore({
            id: `${Date.now()}`,
            name: winner.name,
            avatar: winner.avatar,
            score: winner.score,
            players: game.players.length,
            rounds: game.round,
            durationMs: Math.max(0, Date.now() - matchStartRef.current),
            date: Date.now(),
          }),
        );
      }
    } else {
      savedRef.current = false;
    }
  }, [game.phase, game.players, game.round, screen]);

  /* -------------------------------- actions ------------------------------- */
  const startMatch = useCallback(
    (roster: Roster, target: number, passScreens: boolean) => {
      const n = roster.count ?? roster.names.length;
      const players = Array.from({ length: n }, (_, i) => ({
        name: (roster.names[i] || `Player ${i + 1}`).trim() || `Player ${i + 1}`,
        avatar: roster.avatars[i] || "🎴",
        isBot: !!roster.bots[i],
      }));
      setupRef.current = { roster, target, passScreens };
      setSettings((s) => {
        const next: Settings = {
          ...s,
          target,
          passScreens,
          names: roster.names,
          avatars: roster.avatars,
          bots: roster.bots,
        };
        saveSettings(next);
        return next;
      });
      matchStartRef.current = Date.now();
      savedRef.current = false;
      pausedAtRef.current = 0;
      unoDeadlineRef.current = null;
      setPaused(false);
      setScreen("game");
      dispatch({ type: "START", players, target, passScreens });
      fx.rain(CONFETTI, 40);
      sfx.play("deal");
    },
    [],
  );

  const rematch = useCallback(() => {
    const s = setupRef.current;
    if (s) startMatch(s.roster, s.target, s.passScreens);
  }, [startMatch]);

  const quickPlay = useCallback(() => {
    startMatch(
      {
        names: ["You", "Ada", "Bolt", "Cleo"],
        avatars: ["🦊", "🦄", "🦖", "🐼"],
        bots: [false, true, true, true],
        count: 4,
      },
      200,
      false,
    );
  }, [startMatch]);

  const toMenu = useCallback(() => {
    setScreen("menu");
    setPaused(false);
    setHelp(false);
    unoDeadlineRef.current = null;
    dispatch({ type: "QUIT" });
  }, []);

  /** Pause with UNO-timer bookkeeping: the clock stops while paused. */
  const pauseGame = useCallback(() => {
    if (pausedAtRef.current === 0) pausedAtRef.current = Date.now();
    setPaused(true);
  }, []);
  const resumeGame = useCallback(() => {
    if (pausedAtRef.current !== 0 && unoDeadlineRef.current !== null) {
      unoDeadlineRef.current += Date.now() - pausedAtRef.current;
    }
    pausedAtRef.current = 0;
    setPaused(false);
  }, []);

  const playCard = useCallback(
    (card: Card, el: HTMLElement | null) => {
      if (!me) return;
      const inDrawn = game.phase === "drawn" && game.drawnCardId === card.id;
      if (game.phase !== "play" && !inDrawn) {
        sfx.play("error");
        setShakeId(card.id);
        window.setTimeout(() => setShakeId((v) => (v === card.id ? null : v)), 420);
        return;
      }
      if (actionLockRef.current.key === "play" && Date.now() - actionLockRef.current.at < 220)
        return;
      actionLockRef.current = { key: "play", at: Date.now() };
      const top = topCard(game.discard);
      if (!canPlay(card, top, game.activeColor, game.pendingDraw, me.hand)) {
        sfx.play("error");
        setShakeId(card.id);
        fx.shake(5, 220);
        window.setTimeout(() => setShakeId((v) => (v === card.id ? null : v)), 420);
        return;
      }
      if (el && discardRef.current) flyClone(el, discardRef.current, 320);
      setHint(false);
      dispatch({ type: "PLAY_CARD", cardId: card.id });
    },
    [game.phase, game.drawnCardId, game.discard, game.activeColor, game.pendingDraw, me],
  );

  const drawCard = useCallback(() => {
    if (game.phase !== "play" || game.pendingDraw > 0) return;
    if (actionLockRef.current.key === "draw" && Date.now() - actionLockRef.current.at < 220)
      return;
    actionLockRef.current = { key: "draw", at: Date.now() };
    if (deckRef.current && handRef.current) {
      flyBack(deckRef.current, handRef.current, 340);
      fx.shake(3, 140);
    }
    sfx.play("draw");
    dispatch({ type: "DRAW" });
  }, [game.phase, game.pendingDraw]);

  const takePenalty = useCallback(() => {
    const n = game.pendingDraw;
    if (actionLockRef.current.key === "penalty" && Date.now() - actionLockRef.current.at < 400)
      return;
    actionLockRef.current = { key: "penalty", at: Date.now() };
    if (deckRef.current && handRef.current) {
      for (let i = 0; i < Math.min(n, 5); i++) flyBack(deckRef.current, handRef.current, 400, i * 110);
      fx.shake(6 + n * 2, 420);
    }
    dispatch({ type: "TAKE_PENALTY" });
  }, [game.pendingDraw]);

  /* ------------------------------- keyboard ------------------------------- */
  useEffect(() => {
    if (screen !== "game") return;
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key;
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (k === "Escape") {
        ev.preventDefault();
        if (help) setHelp(false);
        else if (game.phase === "matchEnd" || game.phase === "roundEnd") return;
        else if (paused) resumeGame();
        else pauseGame();
        return;
      }
      if (help) {
        if (k === " " || k === "Enter") {
          ev.preventDefault();
          setHelp(false);
        }
        return;
      }
      if (paused) return;
      const hand = game.players[game.current]?.hand ?? [];
      switch (game.phase) {
        case "pass":
          if (k === " " || k === "Enter") {
            ev.preventDefault();
            if (me && !me.isBot) dispatch({ type: "BEGIN_TURN" });
          }
          return;
        case "penalty":
          if (k === " " || k === "Enter") {
            ev.preventDefault();
            takePenalty();
          }
          return;
        case "uno":
          if (k.toLowerCase() === "u" || k === " " || k === "Enter") {
            ev.preventDefault();
            dispatch({ type: "CALL_UNO" });
          }
          return;
        case "color": {
          const map: Record<string, Color> = { "1": "red", "2": "yellow", "3": "green", "4": "blue" };
          if (map[k]) {
            ev.preventDefault();
            dispatch({ type: "CHOOSE_COLOR", color: map[k] });
          }
          return;
        }
        case "drawn":
          if (k === " " || k === "Enter") {
            ev.preventDefault();
            const c = hand.find((x) => x.id === game.drawnCardId);
            if (c && canPlay(c, topCard(game.discard), game.activeColor, 0, hand)) {
              const el = document.querySelector(`[data-card-id="${c.id}"]`);
              playCard(c, el as HTMLElement | null);
            } else {
              dispatch({ type: "KEEP_DRAWN" });
            }
          }
          if (k.toLowerCase() === "k") dispatch({ type: "KEEP_DRAWN" });
          return;
        case "roundEnd":
          if (k === " " || k === "Enter") {
            ev.preventDefault();
            dispatch({ type: "NEXT_ROUND" });
          }
          return;
        case "matchEnd":
          if (k.toLowerCase() === "r") rematch();
          if (k.toLowerCase() === "m") toMenu();
          return;
        case "play": {
          if (k === "ArrowRight" || k === "ArrowUp") {
            ev.preventDefault();
            setSelectedIdx((i) => Math.min(hand.length - 1, i + 1));
            sfx.play("click");
            return;
          }
          if (k === "ArrowLeft" || k === "ArrowDown") {
            ev.preventDefault();
            setSelectedIdx((i) => Math.max(0, i - 1));
            sfx.play("click");
            return;
          }
          if (/^[1-9]$/.test(k)) {
            const i = Number(k) - 1;
            if (i < hand.length) {
              setSelectedIdx(i);
              sfx.play("click");
            }
            return;
          }
          if (k === " " || k === "Enter") {
            ev.preventDefault();
            const c = hand[selectedIdx];
            if (c) {
              const el = document.querySelector(`[data-card-id="${c.id}"]`);
              playCard(c, el as HTMLElement | null);
            }
            return;
          }
          if (k.toLowerCase() === "d") {
            ev.preventDefault();
            drawCard();
          }
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    screen,
    game,
    paused,
    help,
    selectedIdx,
    me,
    playCard,
    drawCard,
    takePenalty,
    rematch,
    toMenu,
    pauseGame,
    resumeGame,
  ]);

  /* --------------------------------- render -------------------------------- */
  const showPass =
    game.phase === "pass" && game.passScreens && !!me && !me.isBot && !paused && !help;
  const drawnCard = game.drawnCardId
    ? (me?.hand.find((c) => c.id === game.drawnCardId) ?? null)
    : null;
  const drawnPlayable =
    !!drawnCard && canPlay(drawnCard, topCard(game.discard), game.activeColor, 0, me?.hand);
  const playableCount = useMemo(() => {
    if (!me || game.phase !== "play") return 0;
    const top = topCard(game.discard);
    return me.hand.filter((c) => canPlay(c, top, game.activeColor, game.pendingDraw, me.hand))
      .length;
  }, [me, game.phase, game.discard, game.activeColor, game.pendingDraw]);

  return (
    <div ref={rootRef} className="felt relative h-[100dvh] w-full overflow-hidden">
      {screen === "menu" ? (
        <StartScreen
          settings={settings}
          scores={scores}
          onStart={startMatch}
          onQuickPlay={quickPlay}
          onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
          onHelp={() => setHelp(true)}
          onClearScores={() => {
            clearScores();
            setScores([]);
          }}
        />
      ) : (
        <div className="relative flex h-full w-full flex-col">
          {/* top bar */}
          <header className="relative z-20 flex shrink-0 items-center justify-between gap-2 px-3 pt-2">
            <button
              onClick={pauseGame}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sm text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/20"
              aria-label="Pause"
            >
              ⏸
            </button>
            <div className="flex flex-1 flex-col items-center">
              <div className="font-display flex items-center gap-2 text-[11px] tracking-[0.25em] text-white/60 uppercase">
                <span>Round {game.round}</span>
                <span className="text-white/25">•</span>
                <span>to {game.target}</span>
              </div>
              <div className="max-w-[52vw] truncate text-[10px] text-white/35">
                {game.log[0]?.text}
              </div>
            </div>
            <button
              onClick={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sm text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/20"
              aria-label="Toggle sound"
              aria-pressed={settings.sound}
            >
              {settings.sound ? "🔊" : "🔇"}
            </button>
          </header>

          <ScoreStrip players={game.players} target={game.target} current={game.current} />

          <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
            <div className="flex min-h-full flex-col justify-center gap-1">
              <div className="relative z-10 shrink-0 px-1 py-1">
                <OpponentRail
                  players={game.players}
                  current={game.current}
                  excludeId={me?.id ?? -1}
                  compact={compact}
                />
              </div>
              <div className="relative flex items-center justify-center">
                <TableCenter
                  game={game}
                  onDraw={drawCard}
                  discardRef={discardRef}
                  deckRef={deckRef}
                  canDraw={game.phase === "play" && game.pendingDraw === 0 && !!human}
                  pileWidth={vw < 400 ? 56 : vw < 768 ? 66 : 82}
                />
              </div>
            </div>
          </div>

          {/* turn bar */}
          <div className="relative z-20 flex shrink-0 items-center justify-center gap-2 px-3 py-1">
            <div
              key={`${game.round}-${game.current}`}
              className="animate-popIn flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 ring-1 ring-white/10"
            >
              <span className="text-lg leading-none">{me?.avatar}</span>
              <span className="font-display text-xs tracking-wider text-white uppercase">
                {me?.name}&apos;s turn
              </span>
              {game.phase === "play" && human && (
                <span
                  className={`font-display rounded-full px-2 py-0.5 text-[10px] ${
                    playableCount > 0 ? "bg-emerald-400/20 text-emerald-300" : "bg-white/10 text-white/50"
                  }`}
                >
                  {playableCount > 0 ? `${playableCount} playable` : "draw a card"}
                </span>
              )}
            </div>
          </div>

          {/* drawn card prompt */}
          {game.phase === "drawn" && human && drawnCard && (
            <div className="animate-slideUp relative z-20 mx-2 mb-1 flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/50 p-2.5">
              <UnoCard card={drawnCard} width={38} />
              <div className="min-w-0 flex-1 text-xs text-white/70">
                <div className="font-display text-[11px] tracking-wider text-white uppercase">
                  You drew
                </div>
                <div className="truncate">
                  {drawnPlayable ? "It plays! Throw it down?" : "No luck — keep it and pass on."}
                </div>
              </div>
              {drawnPlayable && (
                <Btn
                  variant="gold"
                  className="px-4 py-2.5 text-xs"
                  onClick={() => {
                    const el = document.querySelector(`[data-card-id="${drawnCard.id}"]`);
                    playCard(drawnCard, el as HTMLElement | null);
                  }}
                >
                  Play
                </Btn>
              )}
              <Btn
                variant="ghost"
                className="px-4 py-2.5 text-xs"
                onClick={() => dispatch({ type: "KEEP_DRAWN" })}
              >
                Keep
              </Btn>
            </div>
          )}

          {/* hand + action row */}
          <div className="relative z-10 shrink-0 pb-[max(6px,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-center gap-2 pb-1">
              <button
                onClick={drawCard}
                disabled={game.phase !== "play" || game.pendingDraw > 0 || !human}
                className="font-display rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 px-5 py-2.5 text-xs text-white uppercase shadow-[0_5px_0_#1e3a8a] transition-all active:translate-y-1 active:shadow-[0_1px_0_#1e3a8a] disabled:opacity-30 disabled:shadow-none"
              >
                ⛃ Draw card <span className="hidden sm:inline opacity-60">· D</span>
              </button>
              <span className="font-display hidden rounded-2xl bg-white/5 px-3 py-2.5 text-[10px] tracking-widest text-white/35 uppercase sm:block">
                ← → pick · enter play
              </span>
            </div>
            {hint && human && game.phase === "play" && (
              <div className="animate-popIn mx-auto mb-1 w-fit max-w-[92%] rounded-2xl bg-white px-4 py-1.5 text-center shadow-xl">
                <div className="font-display text-[11px] tracking-wider text-slate-900 uppercase">
                  tap a card that matches
                </div>
                <div className="text-[11px] text-slate-500">
                  same colour, number or symbol — or hit DRAW
                </div>
              </div>
            )}
            <HandArea
              game={game}
              cardWidth={cardWidth}
              selectedId={
                game.phase === "play" && human ? (me?.hand[selectedIdx]?.id ?? null) : null
              }
              onPlay={playCard}
              shakeId={shakeId}
              drawnCardId={game.drawnCardId}
              handRef={handRef}
              faceDown={!!me?.isBot}
            />
          </div>
        </div>
      )}

      {/* overlays */}
      {screen === "game" && showPass && me && (
        <PassScreen player={me} game={game} onReady={() => dispatch({ type: "BEGIN_TURN" })} />
      )}
      {screen === "game" && game.phase === "penalty" && human && !paused && !help && (
        <PenaltyPrompt game={game} player={me} onTake={takePenalty} />
      )}
      {screen === "game" && game.phase === "uno" && human && !paused && !help && me && (
        <UnoPrompt
          player={me}
          deadline={unoDeadlineRef.current ?? Date.now() + UNO_MS}
          total={UNO_MS}
          onCall={() => dispatch({ type: "CALL_UNO" })}
          onMiss={() => dispatch({ type: "MISS_UNO" })}
        />
      )}
      {screen === "game" && game.phase === "color" && human && !paused && !help && (
        <ColorPicker onPick={(c) => dispatch({ type: "CHOOSE_COLOR", color: c })} />
      )}
      {screen === "game" && game.phase === "roundEnd" && !paused && game.history.length > 0 && (
        <RoundEndScreen
          game={game}
          result={game.history[game.history.length - 1]}
          onNext={() => dispatch({ type: "NEXT_ROUND" })}
        />
      )}
      {screen === "game" && game.phase === "matchEnd" && (
        <MatchEndScreen
          game={game}
          scores={scores}
          onRestart={rematch}
          onMenu={toMenu}
        />
      )}
      {paused && screen === "game" && (
        <PauseScreen
          onResume={resumeGame}
          onRestart={rematch}
          onMenu={toMenu}
          sound={settings.sound}
          onToggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
          onHelp={() => setHelp(true)}
        />
      )}
      {help && <HelpScreen onClose={() => setHelp(false)} />}

      {/* fx layers */}
      {banner && (
        <div
          key={banner.id}
          className="animate-bannerIn pointer-events-none fixed inset-0 z-[65] flex items-center justify-center"
        >
          <span
            className="font-display text-center text-4xl sm:text-6xl"
            style={{
              color: banner.color,
              textShadow: `0 0 28px ${banner.color}, 0 6px 0 rgba(0,0,0,.45)`,
            }}
          >
            {banner.text}
          </span>
        </div>
      )}
      {flash && (
        <div
          key={flash.id}
          className="animate-flashOut pointer-events-none fixed inset-0 z-[62]"
          style={{
            background: `radial-gradient(circle at 50% 45%, ${flash.color}bb, ${flash.color}22 45%, transparent 70%)`,
          }}
        />
      )}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[70]" />
    </div>
  );
}

export type { GameState };
