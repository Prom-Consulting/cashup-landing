// Flat brand illustrations: flame forms, graphite line work, cream and smoke washes.
// All decorative — each root svg is aria-hidden.

type ArtProps = { className?: string };

const INK = "var(--graphite)";
const PINK = "var(--flame)";
const GUM = "var(--amber)";
const CHALK = "var(--paper)";

// Фирменный жетон: знак Loal (кошелёк с буквой L) в оранжевом круге.
export function Coin({ className = "" }: ArtProps) {
  return (
    <svg viewBox="0 0 64 68" className={className} aria-hidden="true">
      <circle cx="32" cy="36" r="30" fill="#c42700" />
      <circle cx="32" cy="31" r="30" fill={PINK} />
      <g transform="translate(13 12) scale(0.59)" fill={CHALK}>
        <path d="M31 5.2a3.2 3.2 0 0 1 4.6 0l11.8 12.2a3.2 3.2 0 0 1 .1 4.3L31.2 41.4c-1.5 1.7-4.3 1.3-5.3-.8L12.2 23.4a3.2 3.2 0 0 1 .4-4z" />
        <path d="M28.6 43.9c-1.2-1.8.2-4.2 2.4-4.1l20.4.9a3.2 3.2 0 0 1 2.9 2.4l2.3 8.7a3.2 3.2 0 0 1-3.1 4H34a3.2 3.2 0 0 1-2.7-1.4z" />
      </g>
    </svg>
  );
}

// Tiny deterministic QR-like pattern, drawn into a size×size box at (x, y).
export function QrPattern({ x = 0, y = 0, size = 9 }: { x?: number; y?: number; size?: number }) {
  const u = size / 9;
  const cells = Array.from({ length: 81 }, (_, i) => ((i * 37) ^ (i >> 2)) % 3 === 0);
  const eyes = [
    [0, 0],
    [6, 0],
    [0, 6],
  ];
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      <rect width={size} height={size} fill={CHALK} />
      {cells.map((on, i) => {
        const cx = i % 9;
        const cy = Math.floor(i / 9);
        const inEye = eyes.some(([ex, ey]) => cx >= ex && cx < ex + 3 && cy >= ey && cy < ey + 3);
        return on && !inEye ? (
          <rect key={i} x={cx * u} y={cy * u} width={u} height={u} fill={INK} />
        ) : null;
      })}
      {eyes.map(([ex, ey]) => (
        <g key={`${ex}-${ey}`}>
          <rect x={ex * u} y={ey * u} width={3 * u} height={3 * u} fill={INK} />
          <rect x={(ex + 0.6) * u} y={(ey + 0.6) * u} width={1.8 * u} height={1.8 * u} fill={CHALK} />
          <rect x={(ex + 1) * u} y={(ey + 1) * u} width={u} height={u} fill={INK} />
        </g>
      ))}
    </g>
  );
}

/* ---------- Partner categories ---------- */

function Icon({ children, className = "" }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke={INK}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function CoffeeIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M12 26h32v12a14 14 0 0 1-14 14h-4a14 14 0 0 1-14-14z" fill={PINK} />
      <path d="M44 30h4a6 6 0 0 1 0 12h-5" />
      <path d="M22 8c-3 4 3 7 0 11M32 8c-3 4 3 7 0 11" />
      <path d="M8 58h40" />
    </Icon>
  );
}

export function BeautyIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M26 24V13l12-7v18z" fill={PINK} />
      <rect x="24" y="24" width="16" height="10" fill={GUM} />
      <rect x="21" y="34" width="22" height="24" rx="3" fill={INK} />
    </Icon>
  );
}

export function BagIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M12 22h40l-4 36H16z" fill={PINK} />
      <path d="M23 28v-10a9 9 0 0 1 18 0v10" />
    </Icon>
  );
}

export function SportIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M20 32h24" strokeWidth="5" />
      <rect x="12" y="20" width="9" height="24" rx="3" fill={PINK} />
      <rect x="43" y="20" width="9" height="24" rx="3" fill={PINK} />
      <rect x="5" y="25" width="7" height="14" rx="2" fill={INK} />
      <rect x="52" y="25" width="7" height="14" rx="2" fill={INK} />
    </Icon>
  );
}

export function CarIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M6 44v-9l8-13h36l8 13v9z" fill={PINK} />
      <path d="M18 24h28l5 10H13z" fill={CHALK} />
      <circle cx="19" cy="45" r="6" fill={INK} />
      <circle cx="45" cy="45" r="6" fill={INK} />
    </Icon>
  );
}

export function HomeIcon(p: ArtProps) {
  return (
    <Icon {...p}>
      <path d="M10 30 32 12l22 18v26H10z" fill={GUM} />
      <rect x="27" y="38" width="10" height="18" fill={INK} />
      <path d="M6 33 32 10l26 23" />
    </Icon>
  );
}
