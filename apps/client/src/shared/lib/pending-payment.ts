const STORAGE_KEY = "loal.pending-subscription-payment";

type PendingPayment = {
  serial: string;
  createdAt: number;
};

const MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingPayment(serial: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ serial, createdAt: Date.now() } satisfies PendingPayment));
}

export function readPendingPayment(): PendingPayment | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as PendingPayment | null;
    if (!value?.serial || !value.createdAt || Date.now() - value.createdAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return value;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearPendingPayment() {
  localStorage.removeItem(STORAGE_KEY);
}
