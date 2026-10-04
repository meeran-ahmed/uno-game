/* Lightweight juice engine: particles on a single canvas + screen shake + synth SFX. */

type Shape = "rect" | "circle" | "ring";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
  ttl: number;
  shape: Shape;
  g: number;
  drag: number;
}

const MAX_P = 900;

class FxEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private parts: P[] = [];
  private raf = 0;
  private last = 0;
  private dpr = 1;
  private shakeEl: HTMLElement | null = null;
  private shakePower = 0;
  private shakeTime = 0;
  private shakeDur = 0;
  running = false;

  mount(canvas: HTMLCanvasElement, shakeEl: HTMLElement) {
    this.canvas = canvas;
    this.shakeEl = shakeEl;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.ctx = canvas.getContext("2d");
    window.addEventListener("resize", this.resize);
    this.running = true;
    this.last = performance.now();
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  unmount() {
    this.running = false;
    window.removeEventListener("resize", this.resize);
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.parts = [];
    this.canvas = null;
    this.ctx = null;
    this.shakeEl = null;
  }

  private resize = () => {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(window.innerWidth * this.dpr);
    this.canvas.height = Math.floor(window.innerHeight * this.dpr);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
  };

  private tick = (t: number) => {
    if (!this.running) return;
    const dt = Math.min(48, t - this.last);
    this.last = t;
    const ctx = this.ctx;
    if (ctx && this.canvas) {
      if (this.parts.length === 0 && this.shakeTime <= 0) {
        this.raf = requestAnimationFrame(this.tick);
        return;
      }
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      // update + draw
      const keep: P[] = [];
      for (const p of this.parts) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.vy += p.g * (dt / 1000);
        const d = Math.pow(p.drag, dt / 16.67);
        p.vx *= d;
        p.vy *= d;
        p.x += p.vx * (dt / 16.67);
        p.y += p.vy * (dt / 16.67);
        p.rot += p.vr * (dt / 16.67);
        keep.push(p);
        const a = Math.max(0, Math.min(1, p.life / p.ttl));
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size * 0.32, p.size, p.size * 0.64);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, p.size * 0.16);
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      this.parts = keep;
    }
    // shake
    if (this.shakeTime > 0 && this.shakeEl) {
      this.shakeTime -= dt;
      const k = Math.max(0, this.shakeTime / this.shakeDur);
      const p = this.shakePower * k * k;
      const x = (Math.random() * 2 - 1) * p;
      const y = (Math.random() * 2 - 1) * p;
      const r = (Math.random() * 2 - 1) * p * 0.12;
      this.shakeEl.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${r.toFixed(3)}deg)`;
      if (this.shakeTime <= 0) this.shakeEl.style.transform = "";
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  burst(x: number, y: number, colors: string | string[], count = 26, power = 1) {
    const palette = Array.isArray(colors) ? colors : [colors];
    if (this.parts.length > MAX_P) return;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = (2 + Math.random() * 9) * power;
      this.parts.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 2 * power,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.5,
        size: 5 + Math.random() * 10,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 420 + Math.random() * 520,
        ttl: 900,
        shape: Math.random() < 0.6 ? "rect" : Math.random() < 0.5 ? "circle" : "ring",
        g: 0.42,
        drag: 0.985,
      });
    }
  }

  fountain(x: number, y: number, colors: string | string[], count = 40) {
    const palette = Array.isArray(colors) ? colors : [colors];
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const sp = 6 + Math.random() * 12;
      this.parts.push({
        x: x + (Math.random() - 0.5) * 120,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        rot: 0,
        vr: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 9,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 900 + Math.random() * 700,
        ttl: 1600,
        shape: "rect",
        g: 0.3,
        drag: 0.99,
      });
    }
  }

  rain(colors: string | string[], count = 90) {
    const palette = Array.isArray(colors) ? colors : [colors];
    const w = window.innerWidth;
    for (let i = 0; i < count; i++) {
      this.parts.push({
        x: Math.random() * w,
        y: -30 - Math.random() * 260,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        size: 7 + Math.random() * 11,
        color: palette[Math.floor(Math.random() * palette.length)],
        life: 2200 + Math.random() * 1200,
        ttl: 3400,
        shape: "rect",
        g: 0.16,
        drag: 0.999,
      });
    }
  }

  shake(power = 10, dur = 320) {
    if (!this.shakeEl) return;
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeDur = dur;
    this.shakeTime = dur;
  }
}

export const fx = new FxEngine();

/* ---------------------------------- SFX ---------------------------------- */

type SfxName =
  | "click"
  | "play"
  | "draw"
  | "error"
  | "skip"
  | "reverse"
  | "wild"
  | "uno"
  | "win"
  | "deal"
  | "penalty";

class Sfx {
  enabled = true;
  private ctx: AudioContext | null = null;

  private ac(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  unlock() {
    this.ac();
  }

  private tone(
    freq: number,
    dur: number,
    opts: { type?: OscillatorType; gain?: number; delay?: number; to?: number } = {},
  ) {
    const ctx = this.ac();
    if (!ctx) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? "triangle";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.to), t0 + dur);
    const peak = (opts.gain ?? 0.16) * 0.9;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  private noise(dur: number, gain = 0.12, delay = 0) {
    const ctx = this.ac();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1400;
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    switch (name) {
      case "click":
        this.tone(520, 0.05, { type: "square", gain: 0.05 });
        break;
      case "play":
        this.tone(560, 0.09, { type: "square", gain: 0.1, to: 940 });
        this.noise(0.06, 0.05);
        break;
      case "draw":
        this.tone(220, 0.11, { type: "sawtooth", gain: 0.08, to: 140 });
        break;
      case "error":
        this.tone(150, 0.16, { type: "square", gain: 0.09, to: 90 });
        break;
      case "skip":
        this.tone(660, 0.09, { type: "square", gain: 0.1 });
        this.tone(440, 0.12, { type: "square", gain: 0.1, delay: 0.09 });
        break;
      case "reverse":
        this.tone(300, 0.22, { type: "triangle", gain: 0.1, to: 900 });
        break;
      case "wild":
        [523, 659, 784].forEach((f, i) =>
          this.tone(f, 0.14, { type: "triangle", gain: 0.09, delay: i * 0.06 }),
        );
        break;
      case "uno":
        [660, 880, 1170].forEach((f, i) =>
          this.tone(f, 0.13, { type: "square", gain: 0.09, delay: i * 0.07 }),
        );
        break;
      case "penalty":
        this.tone(180, 0.3, { type: "sawtooth", gain: 0.11, to: 70 });
        this.noise(0.2, 0.08, 0.02);
        break;
      case "deal":
        this.noise(0.05, 0.05);
        break;
      case "win":
        [523, 659, 784, 1046, 1318].forEach((f, i) =>
          this.tone(f, 0.3, { type: "triangle", gain: 0.12, delay: i * 0.11 }),
        );
        break;
    }
  }
}

export const sfx = new Sfx();

/** Tiny haptic pulse for mobile (silently ignored where unsupported). */
export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate === "function") {
    try {
      nav.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
