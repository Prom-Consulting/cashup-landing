import { cashierApi, type CashierRedemptionQuery } from "@loal/api";
import { useApi, useSession } from "@loal/app-kit";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const cashierKeys = {
  overview: ["cashier", "overview"] as const,
  redemptions: (query: CashierRedemptionQuery) => ["cashier", "redemptions", query] as const,
};

/** Кассир филиала — роль partner_employee в токене. */
export const CASHIER_ROLE = "partner_employee";

export function useCashierSession() {
  const { session, logout } = useSession();
  const membership = session?.merchants.find((item) => item.role === CASHIER_ROLE) ?? null;
  return { session, membership, logout, label: session?.email || "Кассир" };
}

export function useCashierOverview() {
  const api = useApi();
  return useQuery({ queryKey: cashierKeys.overview, queryFn: () => cashierApi(api).overview() });
}

export function useCashierRedemptions(query: CashierRedemptionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: cashierKeys.redemptions(query),
    queryFn: () => cashierApi(api).redemptions(query),
    placeholderData: (previous) => previous,
  });
}

/** После списания история и обзор должны показать свежее. */
export function useRefreshAfterRedeem() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["cashier"] });
  };
}
