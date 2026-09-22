// Знак из брендбука: раскрытый кошелёк, в силуэт которого встроена буква L.
// Корпус — вытянутый ромб, отворот — клин справа внизу. Скругления дают
// обводка того же цвета со скруглёнными стыками (strokeLinejoin).
// Заливка — фирменный градиент FF3300 → FF9720; на тёмном фоне знак идёт одним цветом.

export function LoalMark({ className = "", tone = "brand" }: { className?: string; tone?: "brand" | "solid" }) {
  const fill = tone === "brand" ? "url(#loal-mark-gradient)" : "currentColor";
  return (
    <svg viewBox="3 2 45 49" className={className} aria-hidden="true">
      {tone === "brand" && (
        <defs>
          <linearGradient id="loal-mark-gradient" x1="6" y1="2" x2="48" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--flame)" />
            <stop offset="1" stopColor="var(--amber)" />
          </linearGradient>
        </defs>
      )}
      <polygon
        points="24.6,5 34.2,19.4 19.8,45.4 5.8,30.6"
        fill={fill}
        stroke={fill}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <polygon
        points="21.6,42.4 43.4,36 47.2,45.4 25,49.4"
        fill={fill}
        stroke={fill}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className = "", size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className={`inline-flex items-center ${lg ? "gap-3" : "gap-2.5"} ${className}`}>
      <LoalMark className={lg ? "h-[42px] w-[42px]" : "h-8 w-8"} />
      <span
        className={`font-brand leading-none font-bold tracking-[-0.02em] text-black ${lg ? "text-[37px]" : "text-[28px]"}`}
      >
        Loal
      </span>
    </span>
  );
}
