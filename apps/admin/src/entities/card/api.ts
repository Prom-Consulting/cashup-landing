import { cardsApi, platformApi, type BuyMonthsInput } from "@loal/api";
import { customerKeys, useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Карта и подписка держателя. Подписка принадлежит человеку, адрес — по номеру карты. */
export const cardKeys = { subscription: (serial: string) => ["cards", serial, "subscription"] as const };

export function useCardSubscription(serial: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: cardKeys.subscription(serial ?? ""),
    queryFn: () => cardsApi(api).subscription(serial!),
    enabled: Boolean(serial),
  });
}

/** Повторный POST продлевает: месяцы прибавляются, баллы за них придут в начале периодов. */
export function useStartCardSubscription(serial: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyMonthsInput) => cardsApi(api).startSubscription(serial, input),
    onSuccess: (data) => {
      queryClient.setQueryData(cardKeys.subscription(serial), data);
      return queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}

export function useCancelCardSubscription(serial: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cardsApi(api).cancelSubscription(serial),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cardKeys.subscription(serial) }),
  });
}

export function useSetCardTier() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serial, tierId }: { serial: string; tierId: string }) =>
      platformApi(api).setCardTier(serial, tierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

/** Новая карта платформы: прежняя отзывается, баланс переезжает на новую. */
export function useIssueDefaultCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => platformApi(api).issueDefaultCard(customerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useArchiveCustomer() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) => platformApi(api).archiveCustomer(customerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
