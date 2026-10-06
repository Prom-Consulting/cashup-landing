"use client";

/**
 * Глазик в поле пароля: показывает и снова прячет введённое. Кнопка внутри поля справа,
 * в порядке Tab идёт после него и не отправляет форму.
 */
export function PasswordToggle({ shown, onToggle, disabled }: { shown: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={shown ? "Скрыть пароль" : "Показать пароль"}
      aria-pressed={shown}
      title={shown ? "Скрыть пароль" : "Показать пароль"}
      className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-ring disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
        {!shown && <path d="M4 4l16 16" />}
      </svg>
    </button>
  );
}
