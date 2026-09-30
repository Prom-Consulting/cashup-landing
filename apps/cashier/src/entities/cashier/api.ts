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
 * Два вида кассира, оба работают здесь, а не в кабинете партнёра:
 * - staff — кассир магазина, его заводит владелец в «Команде»; данные — по магазину;
 * - partner_employee — кассир филиала, его заводит партнёр; данные — /v1/cashier/*.
 */
export const CASHIER_ROLES = ["staff", "partner_employee"];
export type CashierKind = "merchant" | "branch";

export function useCashierSession() {
  const { session, logout } = useSession();
  const memberships = session?.merchants.filter((item) => CASHIER_ROLES.includes(item.role)) ?? [];
  // Кассир филиала точнее: у него свой филиал и своя история
  const membership = memberships.find((item) => item.role === "partner_employee") ?? memberships[0] ?? null;
  const kind: CashierKind | null = !membership ? null : membership.role === "partner_employee" ? "branch" : "merchant";
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
