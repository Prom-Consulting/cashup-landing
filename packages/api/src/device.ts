/**
 * Идентификатор устройства. Бэкенд держит одну активную сессию на аккаунт: вход с новым
 * deviceId гасит предыдущую. Поэтому значение должно пережить перезапуск браузера —
 * храним в localStorage и создаём один раз.
 */
const DEVICE_KEY = "loal.device-id";

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `dev-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getDeviceId(): string {
  try {
    const saved = localStorage.getItem(DEVICE_KEY);
    if (saved && saved.length >= 8) return saved;
    const created = randomId();
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch {
    // Приватный режим: устройство будет новым на каждый запуск — вход всё равно пройдёт
    return randomId();
  }
}
