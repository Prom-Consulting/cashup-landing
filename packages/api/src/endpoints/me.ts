import type { ApiClient } from "../http";
import {
  historyPageSchema,
  myCardSchema,
  referralDashboardSchema,
  subscriptionOfferSchema,
  subscriptionPaymentSchema,
} from "../schemas/me";

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

  /** REF-01: ссылка, статистика и приглашённые. 404 — программу ещё не подключали. */
  referrals: () => api.request(referralDashboardSchema, "/v1/me/referrals"),

  /**
   * Стать реферером. Карта создаётся, если её нет, 2 000 бонусов начисляются один раз —
   * повтор безопасен. Ответ тот же, что у GET /v1/me/referrals.
   */
  enrollReferrals: () => api.request(referralDashboardSchema, "/v1/me/referrals/enroll", { method: "POST", body: {} }),

  /** Опрос после возврата с OctōPAY; сам повторяет применение, если оно не прошло. */
  subscriptionPayment: (paymentId: string) =>
    api.request(subscriptionPaymentSchema, `/v1/me/subscription/payments/${encodeURIComponent(paymentId)}`),
});
