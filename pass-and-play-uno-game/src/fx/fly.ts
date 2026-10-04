/** DOM-level card flight animations using the Web Animations API (60fps, no React re-renders). */

const ease = "cubic-bezier(.22,.85,.3,1)";

export function flyClone(el: HTMLElement, target: HTMLElement, ms = 300, spin = 16) {
  const from = el.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-card-id");
  Object.assign(clone.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "80",
    pointerEvents: "none",
    transform: "none",
    animation: "none",
    transition: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(clone);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const scale = (to.width / from.width) * 0.98;
  const rot = (Math.random() * 2 - 1) * spin;
  const anim = clone.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.5}px,${dy * 0.45 - 26}px) scale(${(1 + scale) / 2}) rotate(${rot / 2}deg)`,
        offset: 0.55,
      },
      { transform: `translate(${dx}px,${dy}px) scale(${scale}) rotate(${rot}deg)`, opacity: 1, offset: 1 },
    ],
    { duration: ms, easing: ease, fill: "forwards" },
  );
  anim.onfinish = () => clone.remove();
  anim.oncancel = () => clone.remove();
}

export function flyBack(
  from: HTMLElement,
  target: HTMLElement,
  ms = 340,
  delay = 0,
  spin = 26,
) {
  const f = from.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  if (!f.width || !t.width) return;
  const w = Math.min(64, f.width);
  const h = w * 1.5;
  const node = document.createElement("div");
  node.style.cssText = `position:fixed;left:${f.left + f.width / 2 - w / 2}px;top:${f.top + f.height / 2 - h / 2}px;width:${w}px;height:${h}px;border-radius:${w * 0.13}px;z-index:80;pointer-events:none;
    background:linear-gradient(160deg,#2a2a3d,#12121c);padding:${w * 0.06}px;box-shadow:0 8px 20px rgba(0,0,0,.5)`;
  const inner = document.createElement("div");
  inner.style.cssText = `height:100%;width:100%;border-radius:${w * 0.09}px;background:radial-gradient(circle at 30% 20%,#3a3a52,#191925);display:flex;align-items:center;justify-content:center`;
  const oval = document.createElement("div");
  oval.style.cssText = `width:82%;height:54%;transform:rotate(-18deg);border-radius:999px;background:linear-gradient(180deg,#f4354f,#b8122a);display:flex;align-items:center;justify-content:center;color:#fff;font:700 ${Math.round(
    w * 0.26,
  )}px/1 system-ui;letter-spacing:-.02em`;
  oval.textContent = "UNO";
  inner.appendChild(oval);
  node.appendChild(inner);
  document.body.appendChild(node);
  const dx = t.left + t.width / 2 - (f.left + f.width / 2);
  const dy = t.top + t.height / 2 - (f.top + f.height / 2);
  const anim = node.animate(
    [
      { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.5}px,${dy * 0.5 - 40}px) rotate(${spin}deg) scale(1.1)`,
        offset: 0.6,
      },
      { transform: `translate(${dx}px,${dy}px) rotate(${spin * 0.4}deg) scale(.72)`, opacity: 0.85, offset: 1 },
    ],
    { duration: ms, delay, easing: ease, fill: "both" },
  );
  anim.onfinish = () => node.remove();
  anim.oncancel = () => node.remove();
}
