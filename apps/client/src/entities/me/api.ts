import { cardsApi, meApi, promoApi, type PaySubscriptionByPhoneInput, type RedeemPromoInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const meKeys = {
  card: ["me", "card"] as const,
  history: (page: number) => ["me", "history", page] as const,
  offer: ["me", "subscription", "offer"] as const,
  payment: (id: string) => ["me", "subscription", "payment", id] as const,
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

/** Предложение подписки v2: цена, срок и баланс цикла — с сервера. Без карты — 404. */
export function useSubscriptionOffer(enabled = true) {
  const api = useApi();
  return useQuery({ queryKey: meKeys.offer, queryFn: () => meApi(api).subscriptionOffer(), enabled, retry: false });
}

/**
 * Запасной путь, пока на сервере нет подписки v2: старая оплата по номеру карты на один
 * период. Убрать, когда бэкенд с /v1/me/subscription/* будет на проде.
 */
export function useLegacyRenewal(serial: string) {
  const api = useApi();
  return useMutation({ mutationFn: () => cardsApi(api).paySubscription(serial, { months: 1 }) });
}

/** Счёт на подписку по planId из offer; повтор до оплаты вернёт тот же счёт. */
export function usePayForSubscription() {
  const api = useApi();
  return useMutation({ mutationFn: (planId: string) => meApi(api).paySubscription(planId) });
}

/**
 * Статус платежа после возврата с OctōPAY. Опрашиваем, пока он не оплачен и не применён
 * (paid + fulfilled) или не отменён; потом перечитываем карту — на ней новый цикл.
 */
export function useSubscriptionPayment(paymentId: string | null) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: meKeys.payment(paymentId ?? ""),
    queryFn: async () => {
      const payment = await meApi(api).subscriptionPayment(paymentId!);
      if (payment.status === "paid" && payment.fulfilled)
        await queryClient.invalidateQueries({ queryKey: meKeys.card });
      return payment;
    },
    enabled: Boolean(paymentId),
    retry: false,
    refetchInterval: (query) => {
      const payment = query.state.data;
      if (!payment) return query.state.error ? false : 2500;
      return (payment.status === "paid" && payment.fulfilled) || payment.status === "cancelled" ? false : 2500;
    },
  });
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

/** Промокод на месяцы подписки: после успеха карта перечитывается — подписка на ней уже с ними. */
export function useRedeemPromo() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RedeemPromoInput) => promoApi(api).redeemForMe(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meKeys.card }),
  });
}
