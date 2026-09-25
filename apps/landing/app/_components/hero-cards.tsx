import { LoalMark } from "@loal/ui/logo";

// Три карты лояльности Loal веером — вертикальные, как пропуска в Apple Wallet.
// Все размеры в em от ширины веера (1em = --w / 100), поэтому карты масштабируются целиком.

type Tone = "amber" | "coal" | "paper";

const tones: Record<Tone, { card: string; text: string; muted: string; number: string; mark: "brand" | "solid" }> = {
  amber: {
    card: "bg-[linear-gradient(150deg,#ffcc91_0%,#ffa33b_35%,#ff5d34_75%,#ff4a3e_100%)]",
    text: "text-white",
    muted: "text-white/75",
    number: "text-white",
    mark: "solid",
  },
  coal: {
    card: "bg-[linear-gradient(160deg,#3a3535_0%,#161515_60%)]",
    text: "text-white",
    muted: "text-white/60",
    number: "text-amber",
    mark: "brand",
  },
  paper: {
    card: "bg-[linear-gradient(160deg,#ffffff_0%,#f4efed_100%)]",
    text: "text-graphite",
    muted: "text-slate",
    number: "text-flame",
    mark: "brand",
  },
};

// Детерминированный «QR»: три поисковых квадрата и псевдослучайные модули.
function FakeQr({ className }: { className: string }) {
  const n = 21;
  const finder = (x: number, y: number) =>
    [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ].some(([fx, fy]) => x >= fx - 1 && x <= fx + 7 && y >= fy - 1 && y <= fy + 7);
  const cells: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if ((x * 7 + y * 13 + x * y * 3) % 5 < 2) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  const eye = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return (
    <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className={className} aria-hidden="true">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} rx="1.5" fill="#fff" />
      <path d={`${eye(0, 0)}${eye(n - 7, 0)}${eye(0, n - 7)}${cells.join("")}`} fill="#161515" fillRule="evenodd" />
    </svg>
  );
}

function LoyaltyCard({ tone, style }: { tone: Tone; style: React.CSSProperties }) {
  const t = tones[tone];
  return (
    <div
      data-hero-card
      className={`absolute top-[9em] left-[35.5em] flex h-[46em] w-[29em] origin-bottom flex-col rounded-[2.2em] p-[2.4em] shadow-[0_2em_4em_rgb(9_8_9/0.22)] ${t.card} ${t.text}`}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-[0.7em]">
          <LoalMark tone={t.mark} className={`h-[3em] w-[3em] ${t.mark === "solid" ? "text-white" : ""}`} />
          <span className="font-brand text-[2.9em] leading-none font-extrabold tracking-[-0.03em]">Loal</span>
        </span>
        <span className={`text-[1.4em] ${t.muted}`}>до 1 октября</span>
      </div>
      <p className={`mt-[3.2em] text-[1.6em] ${t.muted}`}>Баланс бонусов</p>
      <p className={`display mt-[0.15em] text-[5.4em] leading-none whitespace-nowrap ${t.number}`}>15&nbsp;000</p>
      <p className={`mt-[0.6em] text-[1.6em] ${t.muted}`}>бонусов на месяц</p>
      <FakeQr className="mt-auto h-[8em] w-[8em] self-end" />
    </div>
  );
}

export function HeroCards() {
  return (
    <div data-hero-cards className="absolute inset-0" style={{ fontSize: "calc(var(--w) / 100)" }}>
      <LoyaltyCard tone="amber" style={{ transform: "translate(-20em, 4em) rotate(-18deg)" }} />
      <LoyaltyCard tone="paper" style={{ transform: "translate(20em, 4em) rotate(18deg)" }} />
      <LoyaltyCard tone="coal" style={{ transform: "none" }} />
    </div>
  );
}
