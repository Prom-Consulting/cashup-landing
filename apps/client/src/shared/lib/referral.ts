/**
 * Код приглашения из ссылки /ref/{code}. Живёт на устройстве 30 дней: человек может
 * открыть ссылку сейчас, а зарегистрироваться завтра со страницы входа.
 */
const KEY = "loal.client.referral";
const TTL = 30 * 24 * 60 * 60 * 1000;

export function rememberReferral(code: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    // Без хранилища код работает только на самой странице приглашения
  }
}

export function recallReferral(): string | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { code?: string; at?: number } | null;
    if (!saved?.code || !saved.at || Date.now() - saved.at > TTL) return undefined;
    return saved.code;
  } catch {
    return undefined;
  }
}

export function forgetReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Нечего стирать
  }
}
