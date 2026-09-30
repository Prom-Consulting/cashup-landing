import { cashierApi, merchantCabinetApi, merchantsApi, type CashierRedemptionQuery } from "@loal/api";
import { useApi, useSession } from "@loal/app-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const cashierKeys = {
  overview: ["cashier", "overview"] as const,
  redemptions: (query: CashierRedemptionQuery) => ["cashier", "redemptions", query] as const,
  merchant: (id: string) => ["cashier", "merchant", id] as const,
  pos: (id: string) => ["cashier", "pos", id] as const,
};

/**
 * Кассир (staff): его заводят владелец или администратор филиала. Обзор и своя история —
 * /v1/cashier/*, витрина и касса — на просмотр по магазину. Администратор филиала работает
 * в кабинете партнёра.
 */
export const CASHIER_ROLES = ["staff"];
export type CashierKind = "merchant" | "branch";

export function useCashierSession() {
  const { session, logout } = useSession();
  const memberships = session?.merchants.filter((item) => CASHIER_ROLES.includes(item.role)) ?? [];
  const membership = memberships[0] ?? null;
  // Один вид кассира; тип оставлен, чтобы экраны не ветвились заново, если видов станет больше
  const kind = (membership ? "branch" : null) as CashierKind | null;
  return {
    session,
    membership,
    kind,
    merchantId: membership?.merchantId ?? "",
    // С одним местом работы сервер сам знает магазин и лишний merchantId отклоняет
    manyPlaces: memberships.length > 1,
    logout,
    label: session?.email || "Кассир",
  };
}

export function useCashierOverview(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: cashierKeys.overview, queryFn: () => cashierApi(api).overview(), enabled });
}

export function useCashierRedemptions(query: CashierRedemptionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: cashierKeys.redemptions(query),
    queryFn: () => cashierApi(api).redemptions(query),
    placeholderData: (previous) => previous,
  });
}

/** Магазин кассира магазина: название для шапки и обзора. */
export function useCashierMerchant(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: cashierKeys.merchant(merchantId),
    queryFn: () => merchantsApi(api).get(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** Настройки кассы магазина — кассиру только посмотреть. */
export function useCashierPos(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: cashierKeys.pos(merchantId),
    queryFn: () => merchantCabinetApi(api).posSettings(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** После списания история и обзор должны показать свежее. */
export function useRefreshAfterRedeem() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["cashier"] });
  };
}
