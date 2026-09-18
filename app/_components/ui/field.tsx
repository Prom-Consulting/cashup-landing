"use client";

import { useId } from "react";

export type FieldParts = {
  /** id для самого контрола */
  id: string;
  /** id подсказки и ошибки — в aria-describedby */
  describedBy: string | undefined;
  invalid: boolean;
};

/**
 * Обёртка поля: подпись, подсказка, ошибка и связи для скринридеров.
 * Сам контрол получает id и aria-* через render-функцию.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (parts: FieldParts) => React.ReactNode;
}) {
  const base = useId();
  const id = `${base}-control`;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="flex flex-wrap items-baseline gap-x-2 font-medium">
        {label}
        {optional && <span className="text-sm opacity-60">необязательно</span>}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm opacity-70">
          {hint}
        </p>
      )}
      <div className="mt-2">{children({ id, describedBy, invalid: Boolean(error) })}</div>
      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-2 text-sm font-medium text-flame-ink">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
            <circle cx="10" cy="10" r="9" fill="currentColor" />
            <path d="M10 5.5v5.5M10 14.2v.6" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/** Общие классы контролов: одинаковая рамка, фокус и состояние ошибки. */
export const controlClass = (invalid: boolean, extra = "") =>
  [
    "w-full rounded-2xl border-2 bg-paper px-5 py-3.5 transition-colors",
    "focus-visible:outline-none",
    invalid
      ? "border-flame-ink focus-visible:border-flame-ink"
      : "border-smoke hover:border-graphite/40 focus-visible:border-flame",
    extra,
  ].join(" ");
