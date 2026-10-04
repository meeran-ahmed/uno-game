export interface ScoreEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  players: number;
  rounds: number;
  durationMs: number;
  date: number;
}

export interface Settings {
  sound: boolean;
  passScreens: boolean;
  target: number;
  names: string[];
  avatars: string[];
  bots: boolean[];
}

const S_KEY = "uno10.settings.v1";
const H_KEY = "uno10.highscores.v1";

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  passScreens: true,
  target: 500,
  names: ["Amir", "Sara", "Dev", "Nina", "Kai", "Zoe", "Omar", "Lila", "Rex", "Mia"],
  avatars: ["🦊", "🐼", "🐯", "🦄", "🐙", "🐸", "🦉", "🐝", "🦖", "🐨"],
  bots: Array(10).fill(false),
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(S_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(S_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(H_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.score - a.score).slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function saveScore(e: ScoreEntry): ScoreEntry[] {
  const all = [...loadScores(), e].sort((a, b) => b.score - a.score).slice(0, 12);
  try {
    localStorage.setItem(H_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
  return all;
}

export function clearScores() {
  try {
    localStorage.removeItem(H_KEY);
  } catch {
    /* ignore */
  }
}
