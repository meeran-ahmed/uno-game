import { COLOR_DEEP, COLOR_HEX, cardLabel, type Card } from "../game/cards";
import { useId, type CSSProperties, type ReactNode } from "react";

function SkipIcon({ s, color }: { s: number; color: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="9.2" fill="none" stroke={color} strokeWidth="3.4" />
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke={color} strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

function RevIcon({ s, color }: { s: number; color: string }) {
  return (
    <svg width={s * 1.15} height={s} viewBox="0 0 26 24" style={{ display: "block" }}>
      <g fill={color}>
        <path d="M7 4h6a5 5 0 0 1 5 5v1.4l3.6-3.2L18 4V4z" opacity="0" />
        <path d="M8.6 2.6 3 8l5.6 5.4V9.9h5.1c1.7 0 2.9 1.2 2.9 2.8 0 .2 0 .4-.1.6h3.4c.1-.4.1-.8.1-1.2 0-3.3-2.6-5.9-6.2-5.9H8.6V2.6z" />
        <path d="M17.4 21.4 23 16l-5.6-5.4v3.5h-5.1c-1.7 0-2.9-1.2-2.9-2.8 0-.2 0-.4.1-.6H6.1c-.1.4-.1.8-.1 1.2 0 3.3 2.6 5.9 6.2 5.9h5.2v3.6z" />
      </g>
    </svg>
  );
}

export function WildGlyph({ s }: { s: number }) {
  const gid = useId();
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{ display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4354f" />
          <stop offset="35%" stopColor="#f5b301" />
          <stop offset="68%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#2b7fff" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="17" ry="12.5" fill={`url(#${gid})`} transform="rotate(-18 20 20)" />
    </svg>
  );
}

interface CardProps {
  card?: Card;
  faceDown?: boolean;
  width: number;
  className?: string;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  cardId?: string;
  glowColor?: string;
}

export function UnoCard({ card, faceDown, width, className = "", style, onClick, cardId }: CardProps) {
  const h = width * 1.5;
  const base: CSSProperties = { width, height: h, ...style };
  const radius = Math.max(6, width * 0.13);

  if (faceDown || !card) {
    return (
      <div
        data-card-id={cardId}
        onClick={onClick}
        className={`relative shrink-0 select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{
          ...base,
          borderRadius: radius,
          background: "linear-gradient(150deg,#2a2a3d,#12121c 60%,#1c1c2b)",
          padding: Math.max(2, width * 0.06),
          boxShadow: "0 4px 10px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.08)",
        }}
      >
        <div
          className="relative flex h-full w-full items-center justify-center overflow-hidden"
          style={{
            borderRadius: radius * 0.7,
            background: "radial-gradient(circle at 30% 20%,#3a3a52,#191925)",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: "82%",
              height: "56%",
              transform: "rotate(-18deg)",
              borderRadius: "999px",
              background: "linear-gradient(180deg,#f4354f,#b8122a)",
              boxShadow: "0 0 12px rgba(244,53,79,.45)",
            }}
          >
            <span
              className="font-display italic leading-none text-white"
              style={{ fontSize: width * 0.3, letterSpacing: "-0.02em", textShadow: "0 2px 0 rgba(0,0,0,.35)" }}
            >
              UNO
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isWild = card.color === "wild";
  const face = isWild ? COLOR_HEX.wild : COLOR_HEX[card.color];
  const deep = isWild ? "#000" : COLOR_DEEP[card.color];
  const label = cardLabel(card);
  const isIcon = card.kind === "skip" || card.kind === "reverse";
  const glyphSize = width * (card.kind === "wild" ? 0.46 : 0.52);

  const centerInner: ReactNode = isWild ? (
    <div className="relative flex items-center justify-center">
      <WildGlyph s={glyphSize * 1.15} />
      {card.kind === "wild4" && (
        <span
          className="font-display absolute text-white"
          style={{ fontSize: width * 0.3, textShadow: "0 2px 6px rgba(0,0,0,.8)" }}
        >
          +4
        </span>
      )}
      {card.kind === "wild" && (
        <span
          className="font-display absolute text-white"
          style={{ fontSize: width * 0.26, textShadow: "0 2px 6px rgba(0,0,0,.8)" }}
        >
          ★
        </span>
      )}
    </div>
  ) : isIcon ? (
    card.kind === "skip" ? (
      <SkipIcon s={glyphSize * 0.95} color={deep} />
    ) : (
      <RevIcon s={glyphSize} color={deep} />
    )
  ) : (
    <span
      className="font-display leading-none"
      style={{ fontSize: width * (label.length > 1 ? 0.44 : 0.56), color: deep, letterSpacing: "-0.04em" }}
    >
      {label}
    </span>
  );

  return (
    <div
      data-card-id={cardId}
      onClick={onClick}
      className={`relative shrink-0 select-none transition-transform duration-150 ${
        onClick ? "cursor-pointer hover:-translate-y-1" : ""
      } ${className}`}
      style={{
        ...base,
        borderRadius: radius,
        background: "linear-gradient(160deg,#ffffff,#e8e8f0)",
        padding: Math.max(2, width * 0.06),
        boxShadow: `0 6px 14px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.25)`,
      }}
    >
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
        style={{
          borderRadius: radius * 0.72,
          background: `linear-gradient(150deg, ${face}, ${face} 55%, ${deep})`,
        }}
      >
        {/* white oval */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            width: "88%",
            height: "60%",
            transform: "rotate(-18deg)",
            borderRadius: "999px",
            background: isWild
              ? "linear-gradient(160deg,#2b2b3a,#0e0e16)"
              : "linear-gradient(160deg,#ffffff,#f2f2f7)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
          }}
        >
          {centerInner}
        </div>
        {/* corners */}
        <span
          className="font-display absolute leading-none text-white"
          style={{ top: width * 0.06, left: width * 0.1, fontSize: width * 0.24, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
        >
          {label}
        </span>
        <span
          className="font-display absolute leading-none text-white"
          style={{
            bottom: width * 0.06,
            right: width * 0.1,
            fontSize: width * 0.24,
            transform: "rotate(180deg)",
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          {label}
        </span>
        {/* sheen */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 42%, rgba(0,0,0,.12) 100%)",
          }}
        />
      </div>
    </div>
  );
}
