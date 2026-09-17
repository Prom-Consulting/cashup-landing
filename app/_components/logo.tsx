// Wordmark: a magenta coin with an up-tick, then the name in the display face.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="var(--magenta)" />
        <path
          d="M10 18.5 16 12.5l6 6"
          fill="none"
          stroke="var(--chalk)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="display text-[1.9rem] leading-none text-forest">CashUp</span>
    </span>
  );
}
