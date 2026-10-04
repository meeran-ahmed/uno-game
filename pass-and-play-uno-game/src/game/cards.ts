export type Color = "red" | "yellow" | "green" | "blue";
export type CardColor = Color | "wild";
export type Kind = "number" | "skip" | "reverse" | "draw2" | "wild" | "wild4";

export interface Card {
  id: string;
  color: CardColor;
  kind: Kind;
  num?: number;
}

export const COLORS: Color[] = ["red", "yellow", "green", "blue"];

export const COLOR_HEX: Record<CardColor, string> = {
  red: "#f4354f",
  yellow: "#f5b301",
  green: "#22c55e",
  blue: "#2b7fff",
  wild: "#1b1b26",
};

export const COLOR_DEEP: Record<CardColor, string> = {
  red: "#b8122a",
  yellow: "#b57e00",
  green: "#12833c",
  blue: "#1550b4",
  wild: "#000010",
};

export function cardLabel(c: Card): string {
  switch (c.kind) {
    case "number":
      return String(c.num);
    case "skip":
      return "⦸";
    case "reverse":
      return "⇄";
    case "draw2":
      return "+2";
    case "wild":
      return "★";
    case "wild4":
      return "+4";
  }
}

export function cardPoints(c: Card): number {
  if (c.kind === "number") return c.num ?? 0;
  if (c.kind === "wild" || c.kind === "wild4") return 50;
  return 20;
}

let uid = 0;
const nextId = (p: string) => `${p}${(uid++).toString(36)}`;

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    deck.push({ id: nextId("c"), color, kind: "number", num: 0 });
    for (let n = 1; n <= 9; n++) {
      deck.push({ id: nextId("c"), color, kind: "number", num: n });
      deck.push({ id: nextId("c"), color, kind: "number", num: n });
    }
    for (const kind of ["skip", "reverse", "draw2"] as Kind[]) {
      deck.push({ id: nextId("c"), color, kind });
      deck.push({ id: nextId("c"), color, kind });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: nextId("c"), color: "wild", kind: "wild" });
    deck.push({ id: nextId("c"), color: "wild", kind: "wild4" });
  }
  return shuffle(deck);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Official UNO matching rules.
 * If `hand` is supplied, the Wild Draw Four restriction is enforced:
 * W+4 may only be played when the player holds NO other card of the active colour.
 * (Matching by number does not block W+4 — only the colour matters, per Mattel rules.)
 */
export function canPlay(
  card: Card,
  top: Card,
  activeColor: Color,
  pendingDraw: number,
  hand?: Card[],
): boolean {
  if (pendingDraw > 0) return false;
  if (card.color === "wild") {
    if (card.kind === "wild4" && hand) {
      const holdsColor = hand.some((c) => c.id !== card.id && c.color === activeColor);
      if (holdsColor) return false;
    }
    return true;
  }
  if (card.color === activeColor) return true;
  if (card.kind === "number" && top.kind === "number" && card.num === top.num) return true;
  if (card.kind !== "number" && card.kind === top.kind) return true;
  return false;
}

export function topCard(discard: Card[]): Card {
  return discard[discard.length - 1];
}
