import { cardsApi, meApi, type BuyMonthsInput, type PaySubscriptionByPhoneInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery } from "@tanstack/react-query";

export const meKeys = {
  card: ["me", "card"] as const,
  history: (page: number) => ["me", "history", page] as const,
};

/** 404 значит «карты ещё нет» — это состояние экрана, а не ошибка. */
export function useMyCard() {
  const api = useApi();
  return useQuery({ queryKey: meKeys.card, queryFn: () => meApi(api).card(), retry: false });
}

export function useMyHistory(page: number) {
  const api = useApi();
  return useQuery({
    queryKey: meKeys.history(page),
    queryFn: () => meApi(api).history({ page, pageSize: 20 }),
    placeholderData: (previous) => previous,
  });
}

/** Оплата подписки по уже выпущенной карте. */
export function usePaySubscription(serial: string) {
  const api = useApi();
  return useMutation({ mutationFn: (input: BuyMonthsInput) => cardsApi(api).paySubscription(serial, input) });
}

/**
 * Оплата для человека без карты: карта заводится по телефону вместе со счётом,
 * в ответе приходит её номер и ссылка на добавление в Wallet.
 */
export function usePaySubscriptionByPhone() {
  const api = useApi();
  return useMutation({
    mutationFn: (input: PaySubscriptionByPhoneInput) => cardsApi(api).paySubscriptionByPhone(input),
  });
}
