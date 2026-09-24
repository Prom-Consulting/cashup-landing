// Знак из брендбука Loal 2026: раскрытый кошелёк, в силуэт которого встроена буква L.
// Корпус — вытянутый ромб, отворот — клин внизу, между ними — сгиб. Заливка — фирменный
// градиент от светлого оранжевого к насыщенному; на тёмном и в одну краску — цветом текста.

import { useId } from "react";

const BODY =
  "M44.4 1.2c.4-.7 1.4-.7 1.8 0l20.5 36.6c.4.7.4 1.6-.1 2.3L37.3 85.6c-3.2 5-4.8 10-4.8 15.4 0 2.8.4 5.4 1.1 7.4.1.3-.1.6-.4.6h-5.4c-.5 0-1-.3-1.2-.7L1 70.1c-.8-1.2-.8-2.7 0-3.9z";
const FLAP =
  "M36.4 93.3c.3-1.1 1.2-1.9 2.3-2.2L86.5 78.9c1-.3 2.1.2 2.6 1.1l12.6 22.3c1.6 2.9-.5 6.4-3.8 6.4L41.2 109c-3.5 0-5.9-2.9-5.9-6.6z";

export function LoalMark({ className = "", tone = "brand" }: { className?: string; tone?: "brand" | "solid" }) {
  const id = useId().replace(/:/g, "");
  const fill = tone === "brand" ? `url(#${id})` : "currentColor";
  return (
    <svg viewBox="0 0 103 110" className={className} aria-hidden="true">
      {tone === "brand" && (
        <defs>
          <linearGradient id={id} x1="60" y1="0" x2="40" y2="110" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--amber)" />
            <stop offset="0.55" stopColor="var(--flame)" />
            <stop offset="1" stopColor="var(--coral)" />
          </linearGradient>
        </defs>
      )}
      <path d={BODY} fill={fill} />
      <path d={FLAP} fill={fill} />
    </svg>
  );
}

/**
 * Фирменный блок. Варианты из брендбука:
 * - обычный — знак и «Loal»;
 * - direction="corporate" — направление для бизнеса, с косой плашкой «Corporate»;
 * - descriptor — подпись под словом, например «Бонусы по подписке».
 * tone="light" — для тёмного фона: слово белое, знак остаётся градиентным.
 */
export function Logo({
  className = "",
  size = "md",
  direction,
  descriptor,
  tone = "dark",
  mark = "brand",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  direction?: "corporate";
  descriptor?: string;
  tone?: "dark" | "light";
  /** white — на цветном фоне: градиентный знак на оранжевом теряется (брендбук, обложка). */
  mark?: "brand" | "white";
}) {
  const markSize = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-11 w-11" }[size];
  const word = { sm: "text-[22px]", md: "text-[28px]", lg: "text-[38px]" }[size];
  const ink = tone === "light" ? "text-white" : "text-graphite";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LoalMark
        className={`${markSize} ${mark === "white" ? "text-white" : ""}`}
        tone={mark === "white" ? "solid" : "brand"}
      />
      <span className="flex flex-col">
        <span className="flex items-center gap-2">
          <span className={`font-brand leading-none font-extrabold tracking-[-0.03em] ${ink} ${word}`}>Loal</span>
          {direction === "corporate" && (
            <span className="-skew-x-12 rounded-md bg-gradient-to-r from-coral to-flame px-2.5 py-0.5 text-[0.8125rem] leading-tight font-bold text-white">
              <span className="inline-block skew-x-12">Corporate</span>
            </span>
          )}
        </span>
        {descriptor && (
          <span className={`mt-0.5 text-[0.6875rem] leading-none font-semibold ${ink}`}>{descriptor}</span>
        )}
      </span>
    </span>
  );
}

/** Значок-«искра» в круге из брендбука: метка пункта или подписи, не украшение ради украшения. */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="11" strokeWidth="1.2" opacity=".55" />
      <path
        d="M12 5.5c.5 3.3 3.2 6 6.5 6.5-3.3.5-6 3.2-6.5 6.5-.5-3.3-3.2-6-6.5-6.5 3.3-.5 6-3.2 6.5-6.5Z"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
