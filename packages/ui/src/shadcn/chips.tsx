"use client";

import { cn } from "./lib";

/**
 * Выбор нескольких значений чипами — например, филиалов сотрудника. Каждый чип — кнопка
 * с aria-pressed, так что выбор читается и клавиатурой, и скринридером; на телефоне чипы
 * переносятся на новые строки.
 */
export function ChipSelect({
  id,
  options,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  className,
  label,
}: {
  id?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  /** Подпись группы для скринридера, если рядом нет видимой. */
  label?: string;
}) {
  const selected = new Set(value);
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const on = selected.has(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={on}
            disabled={disabled}
            onClick={() =>
              onChange(on ? value.filter((item) => item !== option.value) : [...value, option.value])
            }
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-4 text-base transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
              on
                ? "border-primary bg-primary/10 font-semibold text-foreground"
                : invalid
                  ? "border-destructive bg-surface text-foreground"
                  : "border-border bg-surface text-foreground hover:border-foreground/40",
            )}
          >
            {on && (
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 text-primary">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
