import {
  buildDeck,
  canPlay,
  cardPoints,
  Card,
  Color,
  shuffle,
  topCard,
  type CardColor,
} from "./cards";

export interface Player {
  id: number;
  name: string;
  avatar: string;
  isBot: boolean;
  hand: Card[];
  score: number;
  roundsWon: number;
  unoCalls: number;
  calledUno: boolean;
}

export type Phase =
  | "pass"
  | "play"
  | "color"
  | "drawn"
  | "penalty"
  | "uno"
  | "roundEnd"
  | "matchEnd";

export interface RoundHand {
  id: number;
  name: string;
  avatar: string;
  points: number;
  cards: number;
}

export interface RoundResult {
  round: number;
  winnerId: number;
  winnerName: string;
  gained: number;
  hands: RoundHand[];
}

export interface FxEvent {
  id: number;
  kind: "play" | "skip" | "reverse" | "draw" | "wild" | "uno" | "win" | "penalty" | "round";
  text: string;
  color: string;
  playerId: number;
}

export interface GameState {
  players: Player[];
  drawPile: Card[];
  discard: Card[];
  current: number;
  direction: 1 | -1;
  activeColor: Color;
  pendingDraw: number;
  phase: Phase;
  drawnCardId: string | null;
  awaitUno: boolean;
  target: number;
  round: number;
  dealer: number;
  passScreens: boolean;
  log: { id: number; text: string; color: string }[];
  history: RoundResult[];
  fxEvent: FxEvent | null;
  lastPlayedBy: number | null;
  seed: number;
}

export type Action =
  | {
      type: "START";
      players: Omit<
        Player,
        "hand" | "score" | "roundsWon" | "unoCalls" | "calledUno" | "id"
      >[];
      target: number;
      passScreens: boolean;
    }
  | { type: "BEGIN_TURN" }
  | { type: "PLAY_CARD"; cardId: string }
  | { type: "CHOOSE_COLOR"; color: Color }
  | { type: "DRAW" }
  | { type: "KEEP_DRAWN" }
  | { type: "TAKE_PENALTY" }
  | { type: "CALL_UNO" }
  | { type: "MISS_UNO" }
  | { type: "BOT_MOVE"; pick: number }
  | { type: "BOT_COLOR" }
  | { type: "NEXT_ROUND" }
  | { type: "QUIT" };

let fxId = 1;
let logId = 1;

export function emptyState(): GameState {
  return {
    players: [],
    drawPile: [],
    discard: [],
    current: 0,
    direction: 1,
    activeColor: "red",
    pendingDraw: 0,
    phase: "roundEnd",
    drawnCardId: null,
    awaitUno: false,
    target: 500,
    round: 0,
    dealer: 0,
    passScreens: true,
    log: [],
    history: [],
    fxEvent: null,
    lastPlayedBy: null,
    seed: 0,
  };
}

function addLog(s: GameState, text: string, color = "#cbd5f5") {
  s.log = [{ id: logId++, text, color }, ...s.log].slice(0, 24);
}

function fx(s: GameState, kind: FxEvent["kind"], text: string, color: string, playerId: number) {
  s.fxEvent = { id: fxId++, kind, text, color, playerId };
}

function clone(s: GameState): GameState {
  return {
    ...s,
    players: s.players.map((p) => ({ ...p, hand: p.hand.slice() })),
    drawPile: s.drawPile.slice(),
    discard: s.discard.slice(),
    log: s.log.slice(),
    history: s.history.slice(),
  };
}

/** Draw n cards for player index i, reshuffling the discard when needed. */
function drawFor(s: GameState, i: number, n: number): Card[] {
  const got: Card[] = [];
  for (let k = 0; k < n; k++) {
    if (s.drawPile.length === 0) {
      if (s.discard.length <= 1) break;
      const top = s.discard.pop()!;
      s.drawPile = shuffle(
        s.discard.map((c) => (c.color === "wild" ? { ...c, color: "wild" as CardColor } : c)),
      );
      s.discard = [top];
    }
    const c = s.drawPile.pop();
    if (!c) break;
    s.players[i].hand.push(c);
    got.push(c);
  }
  return got;
}

function nextIndex(s: GameState, steps: number): number {
  const n = s.players.length;
  return (((s.current + s.direction * steps) % n) + n) % n;
}

/** Move on to the following player(s) and set the incoming phase. */
function finishTurn(s: GameState, steps = 1) {
  s.current = nextIndex(s, steps);
  s.drawnCardId = null;
  s.awaitUno = false;
  s.phase = s.pendingDraw > 0 ? "penalty" : "pass";
}

function scoreRound(s: GameState, winnerIdx: number) {
  const winner = s.players[winnerIdx];
  const hands: RoundHand[] = s.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    points: p.hand.reduce((a, c) => a + cardPoints(c), 0),
    cards: p.hand.length,
  }));
  const unoBonus = winner.calledUno ? 10 : 0;
  const gained = hands.reduce((a, h) => a + h.points, 0) + unoBonus;
  winner.score += gained;
  winner.roundsWon += 1;
  const result: RoundResult = {
    round: s.round,
    winnerId: winner.id,
    winnerName: winner.name,
    gained,
    hands,
  };
  s.history = [...s.history, result];
  return result;
}

function dealRound(s: GameState, startFrom: number) {
  const deck = buildDeck();
  s.players = s.players.map((p) => ({ ...p, hand: [], calledUno: false }));
  s.drawPile = [];
  s.discard = [];
  const n = s.players.length;
  for (let r = 0; r < 7; r++) {
    for (let i = 0; i < n; i++) {
      const idx = (startFrom + i) % n;
      s.players[idx].hand.push(deck.pop()!);
    }
  }
  // find a friendly starter card (a number card)
  let startIdx = deck.findIndex((c) => c.kind === "number");
  if (startIdx < 0) startIdx = 0;
  const starter = deck.splice(startIdx, 1)[0];
  s.discard = [starter];
  s.drawPile = deck;
  s.activeColor = starter.color === "wild" ? "red" : (starter.color as Color);
  s.direction = 1;
  s.pendingDraw = 0;
  s.current = startFrom;
  // If (defensively) a wild lands on top, the starting player picks the colour.
  s.phase = starter.color === "wild" ? "color" : "pass";
  s.drawnCardId = null;
  s.awaitUno = false;
  s.lastPlayedBy = null;
  s.round += 1;
}

/* ----------------------- state consistency invariants ------------------------
 * Cheap (O(cards)) sanity checks run after every action. They log to the console
 * the moment the state becomes inconsistent: duplicate/lost cards, bad indices,
 * invalid colours, or pending penalties in an unexpected phase.
 * --------------------------------------------------------------------------- */
function assertConsistency(s: GameState) {
  if (!s.players.length) return;
  const seen = new Set<string>();
  let total = 0;
  const track = (c: Card | undefined, where: string) => {
    total++;
    if (!c || typeof c.id !== "string") {
      console.error(`[uno] invalid card at ${where}`);
      return;
    }
    if (seen.has(c.id)) console.error(`[uno] card ${c.id} exists in two places (${where})`);
    seen.add(c.id);
  };
  s.drawPile.forEach((c, i) => track(c, `drawPile[${i}]`));
  s.discard.forEach((c, i) => track(c, `discard[${i}]`));
  s.players.forEach((p, i) => {
    if (p.hand.length < 0) console.error(`[uno] negative hand size for player ${i}`);
    p.hand.forEach((c, j) => track(c, `player${i}[${j}]`));
  });
  if (total !== 108) console.error(`[uno] card conservation violated: ${total} !== 108`);
  if (s.current < 0 || s.current >= s.players.length) {
    console.error(`[uno] invalid current index ${s.current}`);
  }
  if (s.direction !== 1 && s.direction !== -1) console.error(`[uno] invalid direction ${s.direction}`);
  if (!["red", "yellow", "green", "blue"].includes(s.activeColor)) {
    console.error(`[uno] invalid activeColor ${s.activeColor}`);
  }
  if (s.pendingDraw < 0) console.error(`[uno] negative pendingDraw ${s.pendingDraw}`);
  if (
    s.pendingDraw > 0 &&
    s.phase !== "penalty" &&
    s.phase !== "pass" &&
    s.phase !== "roundEnd" &&
    s.phase !== "matchEnd"
  ) {
    console.error(`[uno] pendingDraw with unexpected phase ${s.phase}`);
  }
}

function reduceCore(state: GameState, action: Action): GameState {
  const s = clone(state);
  switch (action.type) {
    case "START": {
      s.players = action.players.map((p, i) => ({
        ...p,
        id: i,
        hand: [],
        score: 0,
        roundsWon: 0,
        unoCalls: 0,
        calledUno: false,
      }));
      s.target = action.target;
      s.passScreens = action.passScreens;
      s.dealer = 0;
      s.round = 0;
      s.log = [];
      s.history = [];
      dealRound(s, 0);
      addLog(s, `Round 1 — ${s.players[s.current].name} starts!`, "#a78bfa");
      return s;
    }

    case "BEGIN_TURN": {
      if (s.phase !== "pass") return state;
      s.phase = s.pendingDraw > 0 ? "penalty" : "play";
      return s;
    }

    case "PLAY_CARD": {
      const p = s.players[s.current];
      const idx = p.hand.findIndex((c) => c.id === action.cardId);
      if (idx < 0) return state;
      if (s.phase !== "play" && !(s.phase === "drawn" && s.drawnCardId === action.cardId))
        return state;
      const card = p.hand[idx];
      const top = topCard(s.discard);
      if (!canPlay(card, top, s.activeColor, s.pendingDraw, p.hand)) return state;

      p.hand.splice(idx, 1);
      s.discard.push(card);
      s.drawnCardId = null;
      s.lastPlayedBy = s.current;
      const col = card.color === "wild" ? "#f5b301" : card.color;

      if (card.color !== "wild") s.activeColor = card.color;

      const name = p.name;
      if (card.kind === "skip") {
        fx(s, "skip", "SKIPPED!", col, p.id);
        addLog(s, `${name} played Skip`, col);
        const skipped = s.players[nextIndex(s, 1)].name;
        s.log[0].text += ` — ${skipped} loses a turn`;
      } else if (card.kind === "reverse") {
        fx(s, "reverse", "REVERSE!", col, p.id);
        if (s.players.length === 2) {
          addLog(s, `${name} played Reverse (plays again)`, col);
        } else {
          s.direction = (s.direction * -1) as 1 | -1;
          addLog(s, `${name} played Reverse`, col);
        }
      } else if (card.kind === "draw2") {
        fx(s, "draw", "+2", col, p.id);
        s.pendingDraw += 2;
        addLog(s, `${name} played Draw Two — ${s.players[nextIndex(s, 1)].name} draws 2`, col);
      } else if (card.kind === "wild4") {
        fx(s, "draw", "+4 WILD", col, p.id);
        s.pendingDraw += 4;
        addLog(s, `${name} played Wild Draw Four`, col);
      } else if (card.kind === "wild") {
        fx(s, "wild", "WILD", col, p.id);
        addLog(s, `${name} played Wild`, col);
      } else {
        fx(s, "play", "", col, p.id);
        addLog(s, `${name} played ${card.color} ${card.num}`, col);
      }

      // Round won?
      if (p.hand.length === 0) {
        const res = scoreRound(s, s.current);
        addLog(s, `🏆 ${res.winnerName} won round ${s.round} for ${res.gained} pts`, "#facc15");
        if (p.score >= s.target) {
          s.phase = "matchEnd";
          fx(s, "win", `${p.name} WINS THE MATCH!`, "#facc15", p.id);
        } else {
          s.phase = "roundEnd";
          fx(s, "round", `${p.name} won the round!`, "#facc15", p.id);
        }
        return s;
      }

      if (card.color === "wild") {
        s.phase = "color";
        if (p.hand.length === 1) s.awaitUno = true;
        return s;
      }

      if (p.hand.length === 1) {
        s.phase = "uno";
        return s;
      }

      if (card.kind === "skip") finishTurn(s, 2);
      else if (card.kind === "reverse" && s.players.length === 2) finishTurn(s, 2);
      else finishTurn(s, 1);
      return s;
    }

    case "CHOOSE_COLOR": {
      if (s.phase !== "color") return state;
      s.activeColor = action.color;
      addLog(s, `${s.players[s.current].name} chose ${action.color}`, action.color);
      if (s.awaitUno) {
        s.awaitUno = false;
        s.phase = "uno";
        return s;
      }
      finishTurn(s, 1);
      return s;
    }

    case "DRAW": {
      if (s.phase !== "play" || s.pendingDraw > 0) return state;
      const p = s.players[s.current];
      const got = drawFor(s, s.current, 1);
      if (got.length === 0) {
        addLog(s, `Deck empty — ${p.name} passes`, "#94a3b8");
        finishTurn(s, 1);
        return s;
      }
      const card = got[0];
      const top = topCard(s.discard);
      if (canPlay(card, top, s.activeColor, 0, p.hand)) {
        s.drawnCardId = card.id;
        s.phase = "drawn";
      } else {
        s.drawnCardId = card.id;
        s.phase = "drawn";
        addLog(s, `${p.name} drew a card — no play`, "#94a3b8");
      }
      return s;
    }

    case "KEEP_DRAWN": {
      if (s.phase !== "drawn") return state;
      addLog(s, `${s.players[s.current].name} kept the card`, "#94a3b8");
      finishTurn(s, 1);
      return s;
    }

    case "TAKE_PENALTY": {
      if (s.phase !== "penalty") return state;
      const p = s.players[s.current];
      const n = s.pendingDraw;
      drawFor(s, s.current, n);
      s.pendingDraw = 0;
      fx(s, "penalty", `${p.name} DRAWS ${n}`, "#f4354f", p.id);
      addLog(s, `${p.name} drew ${n} and was skipped`, "#f4354f");
      finishTurn(s, 1);
      return s;
    }

    case "CALL_UNO": {
      if (s.phase !== "uno") return state;
      const p = s.players[s.current];
      p.calledUno = true;
      p.unoCalls += 1;
      fx(s, "uno", "UNO!", "#facc15", p.id);
      addLog(s, `${p.name} shouted UNO!`, "#facc15");
      finishTurn(s, 1);
      return s;
    }

    case "MISS_UNO": {
      if (s.phase !== "uno") return state;
      const p = s.players[s.current];
      drawFor(s, s.current, 2);
      fx(s, "penalty", "FORGOT UNO! +2", "#f4354f", p.id);
      addLog(s, `${p.name} forgot to call UNO — draws 2`, "#f4354f");
      finishTurn(s, 1);
      return s;
    }

    case "BOT_MOVE": {
      const p = s.players[s.current];
      if (!p.isBot) return state;
      const top = topCard(s.discard);
      if (s.phase === "penalty") {
        const n = s.pendingDraw;
        drawFor(s, s.current, n);
        s.pendingDraw = 0;
        fx(s, "penalty", `${p.avatar} DRAWS ${n}`, "#f43f5e", p.id);
        addLog(s, `${p.name} drew ${n} and was skipped`, "#f4354f");
        finishTurn(s, 1);
        return s;
      }
      if (s.phase === "uno") {
        p.calledUno = true;
        p.unoCalls += 1;
        fx(s, "uno", "UNO!", "#facc15", p.id);
        finishTurn(s, 1);
        return s;
      }
      if (s.phase === "pass") {
        s.phase = s.pendingDraw > 0 ? "penalty" : "play";
        return s;
      }
      if (s.phase === "color") {
        const counts: Record<Color, number> = { red: 0, yellow: 0, green: 0, blue: 0 };
        p.hand.forEach((c) => {
          if (c.color !== "wild") counts[c.color]++;
        });
        const best = (Object.keys(counts) as Color[]).sort((a, b) => counts[b] - counts[a])[0];
        s.activeColor = best;
        if (s.awaitUno) {
          s.awaitUno = false;
          s.phase = "uno";
          return s;
        }
        finishTurn(s, 1);
        return s;
      }
      if (s.phase === "drawn") {
        // play the drawn card if possible
        const card = p.hand.find((c) => c.id === s.drawnCardId);
        if (card && canPlay(card, top, s.activeColor, 0, p.hand)) {
          return reduceCore(s, { type: "PLAY_CARD", cardId: card.id });
        }
        finishTurn(s, 1);
        return s;
      }
      if (s.phase !== "play") return state;
      const playable = p.hand.filter((c) => canPlay(c, top, s.activeColor, s.pendingDraw, p.hand));
      if (playable.length === 0) {
        return reduceCore(s, { type: "DRAW" });
      }
      // pick smart-ish: prefer matching colour, action cards, dump high points
      const scored = playable.map((c) => {
        let v = cardPoints(c);
        if (c.color === s.activeColor) v += 12;
        if (c.kind === "draw2" || c.kind === "wild4" || c.kind === "skip") v += 20;
        if (c.color === "wild") v -= 6;
        return { c, v };
      });
      scored.sort((a, b) => b.v - a.v);
      const pick = scored[action.pick % scored.length].c;
      return reduceCore(s, { type: "PLAY_CARD", cardId: pick.id });
    }

    case "NEXT_ROUND": {
      if (s.phase !== "roundEnd") return state;
      const lastWinner = s.current;
      dealRound(s, (lastWinner + 1) % s.players.length);
      addLog(s, `Round ${s.round} — ${s.players[s.current].name} starts!`, "#a78bfa");
      return s;
    }

    case "QUIT":
      return emptyState();
    default:
      return state;
  }
}

export function reducer(state: GameState, action: Action): GameState {
  const s = reduceCore(state, action);
  if (s !== state) assertConsistency(s);
  return s;
}
