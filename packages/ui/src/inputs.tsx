"use client";

import { forwardRef, useId, useState } from "react";
import { controlClass } from "./field";

type BaseProps = {
  id: string;
  describedBy?: string;
  invalid: boolean;
};

export const TextInput = forwardRef<
  HTMLInputElement,
  BaseProps & React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ id, describedBy, invalid, className = "", ...rest }, ref) {
  return (
    <input
      ref={ref}
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, className)}
      {...rest}
    />
  );
});

/** Телефон Кыргызстана: ввод превращается в +996 XXX XX XX XX. */
export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^996/, "").slice(0, 9);
  const parts = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean);
  return digits ? `+996 ${parts.join(" ")}` : "";
}

export const PhoneInput = forwardRef<
  HTMLInputElement,
  BaseProps & {
    value: string;
    onValueChange: (value: string) => void;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
  }
>(function PhoneInput({ id, describedBy, invalid, value, onValueChange, onBlur }, ref) {
  return (
    <input
      ref={ref}
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+996 700 00 00 00"
      value={value}
      onChange={(e) => onValueChange(formatPhone(e.target.value))}
      onBlur={onBlur}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, "tabular-nums")}
    />
  );
});

export function Textarea({
  id,
  describedBy,
  invalid,
  value,
  onValueChange,
  onBlur,
  maxLength = 500,
  placeholder,
  rows = 3,
}: BaseProps & {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  maxLength?: number;
  placeholder?: string;
  rows?: number;
}) {
  const counterId = useId();
  const left = maxLength - value.length;
  return (
    <>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        aria-describedby={[describedBy, counterId].filter(Boolean).join(" ")}
        aria-invalid={invalid || undefined}
        className={controlClass(invalid, "resize-y")}
      />
      <p id={counterId} className={`mt-1 text-right text-sm ${left < 40 ? "text-flame-ink" : "opacity-60"}`}>
        Осталось {left} символов
      </p>
    </>
  );
}

/** Карточки-переключатели: обычная радиогруппа, но выглядит как набор карточек. */
export function ChoiceCards<T extends string>({
  name,
  legend,
  value,
  onChange,
  options,
}: {
  name: string;
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string; note: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-lg font-bold">{legend}</legend>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {options.map((o) => (
          <label
            key={o.id}
            className="cursor-pointer rounded-2xl border-2 border-smoke p-4 transition-colors hover:border-graphite/40 has-[:checked]:border-flame has-[:checked]:bg-cream has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flame"
          >
            <input
              type="radio"
              name={name}
              value={o.id}
              checked={value === o.id}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            <span className="block font-bold">{o.label}</span>
            <span className="mt-1 block text-sm opacity-75">{o.note}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Кнопка формы: три вида, одинаковые размеры и фокус. */
export function Button({
  variant = "primary",
  className = "",
  ...rest
}: { variant?: "primary" | "outline" | "quiet" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-flame text-graphite hover:bg-graphite hover:text-paper",
    outline: "border-2 border-graphite hover:bg-graphite hover:text-paper",
    quiet: "bg-cream text-graphite hover:bg-flame",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[10px] px-7 py-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...rest}
    />
  );
}

/** Состояние «отправляется»: кнопка с бегунком. */
export function Spinner() {
  const [id] = useState(() => Math.random().toString(36).slice(2));
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 animate-spin" aria-hidden="true" key={id}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Свой чекбокс: системный спрятан, видимая коробочка рисуется сама. */
export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 font-medium select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 border-smoke bg-paper transition-colors group-hover:border-graphite/40 peer-checked:border-flame peer-checked:bg-flame peer-checked:[&>svg]:scale-100 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flame"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 scale-0 text-graphite transition-transform">
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </label>
  );
}

/** Поле поиска: иконка, скруглённая рамка и крестик для очистки. */
export function SearchInput({
  value,
  onValueChange,
  label,
  placeholder,
  className = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 opacity-55"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full rounded-full border-2 border-smoke bg-paper py-2.5 pr-11 pl-11 transition-colors hover:border-graphite/40 focus-visible:border-flame focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Очистить поиск"
          className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full transition-colors hover:bg-cream"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
