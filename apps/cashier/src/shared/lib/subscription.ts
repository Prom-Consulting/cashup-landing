import type { CashierOverview } from "@loal/api";

/** Принимает ли филиал бонусы: у заведения подписка (null — её нет), и разрешено ли списание кассиру. */
export function subscriptionState(overview: CashierOverview | undefined) {
  const subscription = overview?.subscription;
  const active = subscription?.isActive ?? subscription?.status === "active";
  const until = subscription?.expiresAt ?? null;
  // Право списывать даёт сервер; нет поля — значит, ограничений не сообщили
  const canRedeem = overview?.permissions?.redeem !== false;
  const free = subscription?.free === true;
  return { active: Boolean(active) || free, until: free ? null : until, free, canRedeem };
}
