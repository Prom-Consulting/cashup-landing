/**
 * Платёж подписки, с которым человек ушёл на OctōPAY. На возврате по нему опрашиваем
 * статус — адрес возврата номера платежа не несёт.
 */
const KEY = "loal.client.pending-payment";

export function rememberPayment(paymentId: string) {
  try {
    localStorage.setItem(KEY, paymentId);
  } catch {
    // Без хранилища статус просто не опросим — карта обновится сама
  }
}

export function recallPayment(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function forgetPayment() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Нечего стирать
  }
}
