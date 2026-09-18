import { QrPattern } from "./illustrations";

// Large scenes for the month story. Elements marked data-pop pop in,
// data-draw strokes are drawn on, data-float bob gently once shown.

const INK = "var(--graphite)";
const PINK = "var(--flame)";
const BLUSH = "var(--cream)";
const GUM = "var(--amber)";
const CHALK = "var(--paper)";
const LILAC = "var(--smoke)";
const DISPLAY = { fontFamily: "var(--font-jost)", fontWeight: 700 } as const;
const BODY = { fontFamily: "var(--font-jost)" } as const;

function Sparkle({ x, y, s = 1, fill = GUM }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      data-pop
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0-16C2-6 6-2 16 0 6 2 2 6 0 16-2 6-6 2-16 0-6-2-2-6 0-16Z"
      fill={fill}
    />
  );
}

function MiniCoin({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
  return (
    <g data-pop data-float transform={`translate(${x} ${y})`}>
      <circle cy={r * 0.16} r={r} fill="#c42700" />
      <circle r={r} fill={PINK} />
      <circle r={r * 0.72} fill="none" stroke={GUM} strokeWidth={r * 0.08} />
      <path
        d={`M${-r * 0.36} ${r * 0.16} 0 ${-r * 0.2} ${r * 0.36} ${r * 0.16}`}
        fill="none"
        stroke={CHALK}
        strokeWidth={r * 0.18}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function SubscribeScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden="true">
      <path
        data-draw
        d="M350 330C420 330 450 260 420 170"
        fill="none"
        stroke={PINK}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="2 12"
      />

      <g data-pop transform="rotate(-8 100 280)">
        <path
          d="M40 200h120v150l-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10-12-10-12 10z"
          fill={CHALK}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text x="56" y="232" fill={INK} fontSize="11" fontWeight="700" style={BODY}>
          Подписка
        </text>
        <path d="M56 252h88M56 272h60M56 292h74" stroke={LILAC} strokeWidth="6" strokeLinecap="round" />
        <text x="56" y="334" fill={PINK} fontSize="18" style={DISPLAY}>
          440 сом
        </text>
      </g>

      <g data-pop>
        <rect x="170" y="30" width="180" height="370" rx="34" fill={INK} />
        <rect x="184" y="56" width="152" height="318" rx="22" fill={CHALK} />
        <rect x="235" y="40" width="50" height="8" rx="4" fill={CHALK} opacity="0.3" />
        <text x="260" y="92" textAnchor="middle" fill={INK} fontSize="12" fontWeight="700" style={BODY}>
          OctōPAY
        </text>
        {/* Subscription shown in som: 5 $ at roughly 87.5 som per dollar */}
        <text x="260" y="168" textAnchor="middle" fill={PINK} fontSize="40" style={DISPLAY}>
          440<tspan fontSize="18"> сом</tspan>
        </text>
        <text x="260" y="196" textAnchor="middle" fill={INK} fontSize="11" style={BODY}>
          Подписка Loal
        </text>
        <rect x="211" y="212" width="98" height="98" rx="10" fill={BLUSH} />
        <QrPattern x={220} y={221} size={80} />
        <rect data-scan x="214" y="226" width="92" height="4" rx="2" fill={PINK} />
        <rect x="200" y="326" width="120" height="32" rx="16" fill={PINK} />
        <text x="260" y="347" textAnchor="middle" fill={CHALK} fontSize="11" fontWeight="700" style={BODY}>
          Оплатить
        </text>
      </g>

      <g data-pop data-float>
        <circle cx="412" cy="130" r="42" fill={PINK} />
        <path
          d="M393 131l13 13 25-27"
          fill="none"
          stroke={CHALK}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <Sparkle x={120} y={90} s={1.4} />
      <Sparkle x={470} y={240} s={0.9} fill={PINK} />
      <Sparkle x={410} y={380} s={1.1} />
    </svg>
  );
}

export function WalletScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden="true">
      <g data-pop transform="rotate(-10 250 200)">
        <rect x="95" y="70" width="320" height="200" rx="24" fill={LILAC} />
        <text x="120" y="106" fill={INK} fontSize="12" fontWeight="600" style={BODY}>
          Проездной
        </text>
      </g>
      <g data-pop transform="rotate(-4 250 230)">
        <rect x="95" y="118" width="320" height="200" rx="24" fill={GUM} />
        <text x="120" y="154" fill={INK} fontSize="12" fontWeight="600" style={BODY}>
          Спортзал
        </text>
      </g>
      <g data-pop>
        <rect x="80" y="170" width="350" height="220" rx="26" fill={INK} />
        <text x="108" y="214" fill={CHALK} fontSize="26" style={DISPLAY}>
          Loal
        </text>
        <text x="404" y="210" textAnchor="end" fill={CHALK} fontSize="11" opacity="0.8" style={BODY}>
          до 1 октября
        </text>
        <text x="108" y="262" fill={CHALK} fontSize="11" opacity="0.8" style={BODY}>
          Баланс бонусов
        </text>
        <text x="106" y="344" fill={GUM} fontSize="48" style={DISPLAY}>
          100 000
        </text>
        <rect x="352" y="300" width="56" height="56" rx="8" fill={CHALK} />
        <QrPattern x={356} y={304} size={48} />
      </g>

      <g data-pop data-float>
        <rect x="318" y="44" width="176" height="62" rx="31" fill={PINK} />
        <text x="406" y="87" textAnchor="middle" fill={CHALK} fontSize="29" style={DISPLAY}>
          +100 000
        </text>
      </g>
      <MiniCoin x={58} y={120} r={26} />
      <MiniCoin x={470} y={170} r={18} />
      <MiniCoin x={40} y={380} r={16} />
      <Sparkle x={250} y={40} s={1.2} />
      <Sparkle x={480} y={380} s={1} fill={PINK} />
    </svg>
  );
}

export function PayScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden="true">
      <path data-pop d="M200 238 272 190v120z" fill={PINK} opacity="0.25" />

      <g data-pop transform="rotate(-12 150 260)">
        <rect x="90" y="140" width="124" height="230" rx="22" fill={INK} />
        <rect x="100" y="160" width="104" height="190" rx="14" fill={CHALK} />
        <text x="152" y="192" textAnchor="middle" fill={INK} fontSize="15" style={DISPLAY}>
          Loal
        </text>
        <rect x="112" y="206" width="80" height="80" rx="6" fill={BLUSH} />
        <QrPattern x={118} y={212} size={68} />
        <text x="152" y="322" textAnchor="middle" fill={PINK} fontSize="20" style={DISPLAY}>
          100 000
        </text>
      </g>

      <g data-pop>
        <path d="M290 30h110v120H290z" fill={CHALK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <text x="304" y="52" fill={INK} fontSize="11" fontWeight="700" style={BODY}>
          Кофейня
        </text>
        <path d="M304 66h80M304 80h54" stroke={LILAC} strokeWidth="5" strokeLinecap="round" />
        <text x="304" y="108" fill={PINK} fontSize="17" style={DISPLAY}>
          −400 сом
        </text>
      </g>
      <g data-pop>
        <rect x="262" y="120" width="166" height="272" rx="28" fill={INK} />
        <rect x="282" y="146" width="126" height="92" rx="12" fill={GUM} />
        <text x="345" y="184" textAnchor="middle" fill={INK} fontSize="11" fontWeight="600" style={BODY}>
          К оплате
        </text>
        <text x="345" y="222" textAnchor="middle" fill={INK} fontSize="27" style={DISPLAY}>
          1 600 сом
        </text>
        {[0, 1, 2].map((c) =>
          [0, 1, 2].map((r) => (
            <rect
              key={`${c}-${r}`}
              x={288 + c * 40}
              y={262 + r * 38}
              width="32"
              height="26"
              rx="8"
              fill={CHALK}
              opacity={r === 2 && c === 2 ? 1 : 0.9}
            />
          )),
        )}
        <rect x="368" y="338" width="32" height="26" rx="8" fill={PINK} />
      </g>

      <g data-pop data-float transform="translate(462 90)">
        <path d="M-26-10h40v22a18 18 0 0 1-18 18h-4a18 18 0 0 1-18-18z" fill={PINK} stroke={INK} strokeWidth="3" />
        <path d="M14-4h5a8 8 0 0 1 0 16h-6" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path
          data-draw
          d="M-14-22c-4 5 4 8 0 13M-2-22c-4 5 4 8 0 13"
          fill="none"
          stroke={INK}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <g data-pop>
        <rect x="60" y="408" width="400" height="18" rx="9" fill={INK} />
        <rect data-split-bar x="60" y="408" width="80" height="18" rx="9" fill={PINK} />
      </g>
      <Sparkle x={60} y={80} s={1.2} />
      <Sparkle x={480} y={300} s={0.9} fill={PINK} />
    </svg>
  );
}

export function RefillScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 440" className={className} aria-hidden="true">
      <g data-pop transform="rotate(-6 170 200)">
        <rect x="50" y="70" width="230" height="250" rx="28" fill={CHALK} stroke={INK} strokeWidth="4" />
        <path d="M50 98a28 28 0 0 1 28-28h174a28 28 0 0 1 28 28v30H50z" fill={PINK} />
        <path d="M50 128h230" stroke={INK} strokeWidth="4" />
        <rect x="50" y="70" width="230" height="250" rx="28" fill="none" stroke={INK} strokeWidth="4" />
        <rect x="95" y="46" width="14" height="46" rx="7" fill={INK} />
        <rect x="221" y="46" width="14" height="46" rx="7" fill={INK} />
        <text x="165" y="118" textAnchor="middle" fill={CHALK} fontSize="14" fontWeight="700" style={BODY}>
          октябрь
        </text>
        <text x="165" y="280" textAnchor="middle" fill={INK} fontSize="129" style={DISPLAY}>
          1
        </text>
      </g>

      <path
        data-draw
        d="M478 258A108 108 0 1 1 404 144"
        fill="none"
        stroke={PINK}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path data-pop d="M392 118l30 26-34 20z" fill={PINK} />

      <g data-pop>
        <rect x="300" y="200" width="160" height="104" rx="16" fill={INK} />
        <text x="318" y="230" fill={CHALK} fontSize="14" style={DISPLAY}>
          Loal
        </text>
        <text x="316" y="284" fill={GUM} fontSize="35" style={DISPLAY}>
          100 000
        </text>
      </g>

      <MiniCoin x={300} y={90} r={22} />
      <MiniCoin x={250} y={380} r={28} />
      <MiniCoin x={490} y={400} r={16} />
      <Sparkle x={40} y={380} s={1.3} />
      <Sparkle x={480} y={60} s={1} fill={PINK} />
    </svg>
  );
}

export const storyScenes = [SubscribeScene, WalletScene, PayScene, RefillScene];

// Morph targets for the background blob, one per step.
export const blobPaths = [
  "M300 40C430 40 560 120 560 280S450 560 300 560 40 450 40 290 170 40 300 40Z",
  "M320 30C470 60 580 180 540 330S380 580 240 550 20 400 50 250 170 0 320 30Z",
  "M280 50C400 20 560 90 570 240S500 540 350 570 60 500 40 350 160 80 280 50Z",
  "M300 20C460 30 590 170 560 320S420 590 280 570 30 430 40 280 140 10 300 20Z",
];
