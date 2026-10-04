import { canPlay, topCard, type Card } from "../game/cards";
import type { GameState } from "../game/engine";
import { UnoCard } from "./UnoCard";

export function HandArea({
  game,
  cardWidth,
  selectedId,
  onPlay,
  shakeId,
  drawnCardId,
  handRef,
  faceDown,
}: {
  game: GameState;
  cardWidth: number;
  selectedId: string | null;
  onPlay: (card: Card, el: HTMLElement) => void;
  shakeId: string | null;
  drawnCardId: string | null;
  handRef: React.RefObject<HTMLDivElement | null>;
  faceDown?: boolean;
}) {
  const me = game.players[game.current];
  if (!me || !game.discard.length) return null;
  const hand = me.hand;
  const top = topCard(game.discard);
  const count = hand.length;
  const center = (count - 1) / 2;
  const spread = Math.min(4.5, 34 / Math.max(count, 1));
  const arc = count > 7 ? 0.5 : 2.4;

  const playable = (c: Card) =>
    game.phase === "play" && canPlay(c, top, game.activeColor, game.pendingDraw, hand);

  return (
    <div className="w-full">
      <div
        ref={handRef}
        className="no-scrollbar overflow-x-auto px-3 pt-6 pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="mx-auto flex w-max items-end gap-0">
        {hand.map((c, i) => {
          const isPlayable = playable(c);
          const isSelected = selectedId === c.id;
          const isDrawn = drawnCardId === c.id;
          const rot = (i - center) * spread;
          const ty = Math.pow(Math.abs(i - center), 1.5) * arc;
          const overlap = count > 6 ? -cardWidth * 0.34 : 0;
          return (
            <div
              key={c.id}
              data-card-id={c.id}
              className="shrink-0"
              style={{
                marginLeft: i === 0 ? 0 : overlap,
                zIndex: isSelected ? 50 : i,
                transform: `translateY(${(isSelected ? -18 : 0) - ty}px) rotate(${isSelected ? 0 : rot}deg) scale(${isSelected ? 1.1 : 1})`,
                transition: "transform 180ms cubic-bezier(.2,.9,.3,1.2)",
                filter: isPlayable || game.phase !== "play" ? "none" : "grayscale(.55) brightness(.62)",
                opacity: game.phase === "play" && !isPlayable ? 0.75 : 1,
              }}
            >
              <div
                className={
                  shakeId === c.id
                    ? "animate-shakeX"
                    : isDrawn
                      ? "animate-drawIn"
                      : isSelected
                        ? "animate-lift"
                        : ""
                }
              >
                <UnoCard
                  card={c}
                  faceDown={faceDown}
                  width={cardWidth}
                  onClick={(e) => onPlay(c, e.currentTarget as unknown as HTMLElement)}
                />
              </div>
              {isDrawn && (
                <span className="font-display animate-pulse -mt-1 block text-center text-[10px] text-emerald-300">
                  NEW
                </span>
              )}
            </div>
          );
        })}
          {count === 0 && (
            <div className="py-8 text-center text-sm text-white/40">No cards — nice!</div>
          )}
        </div>
      </div>
    </div>
  );
}
