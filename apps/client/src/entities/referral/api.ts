import { meApi, referralsApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meKeys } from "../me/api";

/** Отметить переход по ссылке: один раз на код за сессию страницы. */
export function useReferralVisit(code: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["referral", "visit", code],
    queryFn: async () => {
      await referralsApi(api).visit(code);
      return true;
    },
    retry: false,
    staleTime: Infinity,
  });
}

export const referralKeys = { dashboard: ["me", "referrals"] as const };

/** Кабинет реферера. 404 — программу ещё не подключали: это состояние экрана, не ошибка. */
export function useReferralDashboard() {
  const api = useApi();
  return useQuery({ queryKey: referralKeys.dashboard, queryFn: () => meApi(api).referrals(), retry: false });
}

/** Стать реферером: ответ — сразу кабинет. Карта могла появиться — перечитываем и её. */
export function useEnrollReferrals() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => meApi(api).enrollReferrals(),
    onSuccess: (dashboard) => {
      queryClient.setQueryData(referralKeys.dashboard, dashboard);
      void queryClient.invalidateQueries({ queryKey: meKeys.card });
    },
  });
}
