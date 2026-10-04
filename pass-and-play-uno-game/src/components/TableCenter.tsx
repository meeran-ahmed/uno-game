import { COLOR_HEX, cardLabel, topCard, type Color } from "../game/cards";
import type { GameState } from "../game/engine";
import { UnoCard } from "./UnoCard";

const COLOR_NAME: Record<Color, string> = {
  red: "Red",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
};

export function TableCenter({
  game,
  onDraw,
  discardRef,
  deckRef,
  canDraw,
  pileWidth = 66,
}: {
  game: GameState;
  onDraw: () => void;
  discardRef: React.RefObject<HTMLDivElement | null>;
  deckRef: React.RefObject<HTMLButtonElement | null>;
  canDraw: boolean;
  pileWidth?: number;
}) {
  if (!game.discard.length) return null;
  const top = topCard(game.discard);
  const stack = game.discard.slice(-3);
  const col = COLOR_HEX[game.activeColor];

  return (
    <div className="relative flex w-full items-center justify-center gap-4 py-2 sm:gap-8">
      {/* colour halo */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[210px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-2xl transition-all duration-500 sm:h-[260px] sm:w-[420px]"
        style={{ background: `radial-gradient(circle, ${col} 0%, transparent 70%)` }}
      />

      {/* direction ring */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[150px] w-[150px] rounded-full border-2 border-dashed opacity-30 sm:h-[190px] sm:w-[190px]"
          style={{
            borderColor: col,
            animation: `spin${game.direction === 1 ? "CW" : "CCW"} 9s linear infinite`,
          }}
        />
      </div>

      {/* draw pile */}
        <button
        ref={deckRef}
        onClick={onDraw}
        disabled={!canDraw}
        className="group relative z-10 shrink-0 transition-transform duration-150 active:scale-95 disabled:opacity-50"
        aria-label="Draw a card"
      >
        <div className="relative">
          <div className="absolute -top-1 left-1 opacity-70">
            <UnoCard faceDown width={pileWidth} />
          </div>
          <UnoCard
            faceDown
            width={pileWidth}
            className={canDraw ? "group-hover:-translate-y-1" : ""}
          />
          <span className="font-display absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0d0b1a] px-2 py-0.5 text-[11px] text-white ring-1 ring-white/25">
            {game.drawPile.length}
          </span>
        </div>
        {canDraw && (
          <span className="font-display absolute -top-3 -right-3 hidden rounded-lg bg-violet-500 px-2 py-0.5 text-[10px] text-white shadow-lg sm:block">
            DRAW
          </span>
        )}
      </button>

      {/* discard pile */}
      <div className="relative z-10 flex shrink-0 items-center justify-center">
        <div
          ref={discardRef}
          className="relative"
          style={{ width: pileWidth, height: pileWidth * 1.5 }}
        >
          {stack.map((c, i) => {
            const isTop = i === stack.length - 1;
            const rot = isTop ? 0 : (i - 1) * 9 - 6;
            return (
              <div
                key={c.id}
                className="absolute inset-0"
                style={{
                  transform: `rotate(${rot}deg) translate(${(i - 1) * 3}px, ${i * 2}px)`,
                  zIndex: i,
                }}
              >
                {isTop ? (
                  <div key={c.id} className="animate-slam h-full w-full">
                    <UnoCard card={c} width={pileWidth} className="h-full w-full" />
                  </div>
                ) : (
                  <UnoCard card={c} width={pileWidth} />
                )}
              </div>
            );
          })}
        </div>
        {game.pendingDraw > 0 && (
          <div className="font-display animate-bounce absolute -top-6 left-1/2 -translate-x-1/2 rounded-lg bg-rose-500 px-2 py-1 text-xs text-white shadow-lg">
            +{game.pendingDraw}
          </div>
        )}
      </div>

      {/* active colour */}
      <div className="z-10 flex w-[64px] shrink-0 flex-col items-center gap-1">
        <div
          className="grid h-11 w-11 place-items-center rounded-xl ring-2 ring-white/40 transition-all duration-300"
          style={{ background: col, boxShadow: `0 0 22px ${col}` }}
        >
          <span className="font-display text-[10px] text-white drop-shadow">{COLOR_NAME[game.activeColor]}</span>
        </div>
        <span className="font-display text-[9px] tracking-widest text-white/50">COLOUR</span>
        <span className="font-display rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
          {cardLabel(top)}
        </span>
      </div>
    </div>
  );
}
