"use client";

import { useId, useRef, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import { Button, type ButtonProps } from "./button";
import { Label } from "./input";
import { cn } from "./lib";

/**
 * Поле формы целиком: подпись, само поле, подсказка и ошибка. Идентификаторы
 * подсказки и ошибки отдаются полю, чтобы скринридер прочитал их вместе с ним.
 */
export function FormField({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: (parts: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Системный выпадающий список в нашем оформлении. На телефоне он открывает родной
 * барабан выбора — удобнее любого самодельного.
 */
export function NativeSelect({
  className,
  describedBy,
  invalid,
  options,
  placeholder,
  ...props
}: ComponentProps<"select"> & {
  describedBy?: string;
  invalid?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}) {
  return (
    <select
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className={cn(
        "h-12 w-full appearance-none rounded-2xl border-2 bg-surface bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22%20stroke=%22%23706f6f%22%20stroke-width=%222%22%20fill=%22none%22/%3E%3C/svg%3E')] bg-[position:right_1rem_center] bg-no-repeat pr-10 pl-4 text-lg text-foreground outline-none transition-colors focus:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
        invalid ? "border-destructive" : "border-border",
        className,
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Переключатель «включено / выключено». Состояние читается и глазами, и скринридером. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-4">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 h-5 w-5 rounded-full bg-surface shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="text-lg">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>}
      </label>
    </div>
  );
}

/** Флажок для выбора строк в таблице. */
export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      type="checkbox"
      className={cn("h-5 w-5 cursor-pointer rounded-md accent-[var(--primary)]", className)}
      {...props}
    />
  );
}

/**
 * Кнопка выбора файла. Настоящий input спрятан, а подпись — обычная кнопка:
 * системное «Выберите файл» в каждом браузере выглядит по-своему.
 */
export function FileButton({
  accept,
  onFile,
  children,
  ...props
}: Omit<ButtonProps, "onClick" | "type"> & { accept?: string; onFile: (file: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <Button type="button" onClick={() => input.current?.click()} {...props}>
        {children}
      </Button>
    </>
  );
}

/** Строка ошибки или результата под формой. */
export function FormStatus({ message, tone = "error" }: { message?: string; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn("text-base font-medium", tone === "error" ? "text-destructive" : "text-secondary")}
    >
      {message}
    </p>
  );
}
