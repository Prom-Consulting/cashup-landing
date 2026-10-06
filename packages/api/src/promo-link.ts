import { promoCodeTextSchema } from "./schemas/promo";

export function promoRegistrationUrl(baseUrl: string, code: string): string {
  const url = new URL("register", `${baseUrl.replace(/\/$/, "")}/`);
  url.searchParams.set("promo", promoCodeTextSchema.parse(code));
  return url.toString();
}

export function promoFromSearch(search: string): string | undefined {
  const parsed = promoCodeTextSchema.safeParse(new URLSearchParams(search).get("promo"));
  return parsed.success ? parsed.data : undefined;
}

const KEY = "loal.client.pending-promo";
const TTL = 30 * 24 * 60 * 60 * 1000;
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Keeps a link through OTP and reloads; works in memory when storage is blocked. */
export function createPendingPromoStore(storage: () => StorageLike, now = Date.now) {
  let memory: { code: string; at: number } | null = null;
  const clear = () => {
    memory = null;
    try { storage().removeItem(KEY); } catch { /* Storage can be disabled. */ }
  };
  return {
    remember(code: string) {
      memory = { code: promoCodeTextSchema.parse(code), at: now() };
      try { storage().setItem(KEY, JSON.stringify(memory)); } catch { /* Keep the in-memory copy. */ }
    },
    recall(): string | undefined {
      let value: unknown = memory;
      try { value = JSON.parse(storage().getItem(KEY) ?? "null") ?? memory; } catch { /* Use memory. */ }
      const saved = value as { code?: unknown; at?: unknown } | null;
      const code = promoCodeTextSchema.safeParse(saved?.code);
      if (!code.success || typeof saved?.at !== "number" || !Number.isFinite(saved.at) || saved.at > now() || now() - saved.at >= TTL) {
        clear();
        return undefined;
      }
      return code.data;
    },
    clear,
  };
}
