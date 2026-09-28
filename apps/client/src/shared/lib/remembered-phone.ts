/**
 * Номер, с которым человек вошёл. Бэкенд не отдаёт телефон аккаунта ни в токене,
 * ни в профиле, а для первой карты он нужен — поэтому помним его на устройстве и
 * подставляем в форму. При выходе стираем: на общем устройстве он чужой.
 */
const KEY = "loal.client.phone";

export function rememberPhone(phone: string) {
  try {
    localStorage.setItem(KEY, phone);
  } catch {
    // Хранилище недоступно — номер просто введут ещё раз
  }
}

export function recallPhone(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function forgetPhone() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Нечего стирать
  }
}
