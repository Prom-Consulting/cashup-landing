import { Toast } from "@loal/ui/shadcn";
import { useCallback, useState } from "react";

const WELCOME_KEY = "loal.welcome";

/** Отметить первый вход заранее заведённого человека — до перехода в кабинет. */
export function rememberWelcome() {
  try {
    sessionStorage.setItem(WELCOME_KEY, "1");
  } catch {
    // Нет хранилища — просто без приветствия
  }
}

function takeWelcome() {
  try {
    const value = sessionStorage.getItem(WELCOME_KEY);
    sessionStorage.removeItem(WELCOME_KEY);
    return Boolean(value);
  } catch {
    return false;
  }
}

/**
 * Приветствие снизу экрана после первого входа: администратор завёл человека заранее, и
 * этим входом он завершил регистрацию (registrationCompleted). Показывается один раз.
 */
export function WelcomeToast({ text = "Регистрация завершена — добро пожаловать в команду" }: { text?: string }) {
  const [message, setMessage] = useState<string | null>(() => (takeWelcome() ? text : null));
  const dismiss = useCallback(() => setMessage(null), []);
  return <Toast message={message} onDismiss={dismiss} />;
}
