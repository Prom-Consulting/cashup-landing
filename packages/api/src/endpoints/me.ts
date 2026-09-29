import type { ApiClient } from "../http";
import { historyPageSchema, myCardSchema, subscriptionOfferSchema, subscriptionPaymentSchema } from "../schemas/me";

/** Кабинет держателя карты: своя карта и своя история, обе — по токену. */
export const meApi = (api: ApiClient) => ({
  /** 404 — карты ещё не выпускали; это не ошибка, а состояние экрана. */
  card: () => api.request(myCardSchema, "/v1/me/card"),

  history: (query: { page?: number; pageSize?: number } = {}) =>
    api.request(historyPageSchema, "/v1/me/history", { query }),

  /** Предложение подписки для того, кто вошёл. Без карты — 404: сначала первая карта. */
  subscriptionOffer: () => api.request(subscriptionOfferSchema, "/v1/me/subscription/offer"),

  /**
   * Счёт на подписку по planId из offer. Повтор до оплаты вернёт тот же счёт. 409
   * SUBSCRIPTION_OFFER_CHANGED — предложение устарело, SUBSCRIPTION_UNAVAILABLE — карта заблокирована.
   */
  paySubscription: (planId: string) =>
    api.request(subscriptionPaymentSchema, "/v1/me/subscription/payments", { method: "POST", body: { planId } }),

  /** Опрос после возврата с OctōPAY; сам повторяет применение, если оно не прошло. */
  subscriptionPayment: (paymentId: string) =>
    api.request(subscriptionPaymentSchema, `/v1/me/subscription/payments/${encodeURIComponent(paymentId)}`),
});
