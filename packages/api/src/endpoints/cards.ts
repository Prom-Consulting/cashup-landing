import type { ApiClient } from "../http";
import { buyMonthsInputSchema, cardSubscriptionSchema, invoiceSchema, type BuyMonthsInput } from "../schemas/billing";
import { cardSchema } from "../schemas/card";

/**
 * Карта и её подписка. Карта принадлежит платформе, поэтому в адресах нет заведения:
 * баллы выдаёт подписка, тратит касса через /v1/redemptions.
 */
export const cardsApi = (api: ApiClient) => ({
  get: (serial: string) => api.request(cardSchema, `/v1/cards/${encodeURIComponent(serial)}`),

  subscription: (serial: string) =>
    api.request(cardSubscriptionSchema.nullable(), `/admin/v1/cards/${encodeURIComponent(serial)}/subscription`),

  startSubscription: (serial: string, input: BuyMonthsInput) =>
    api.request(cardSubscriptionSchema, `/admin/v1/cards/${encodeURIComponent(serial)}/subscription`, {
      method: "POST",
      body: buyMonthsInputSchema.parse(input),
    }),

  cancelSubscription: (serial: string) =>
    api.request(cardSubscriptionSchema.nullable(), `/admin/v1/cards/${encodeURIComponent(serial)}/subscription`, {
      method: "DELETE",
    }),

  /**
   * Счёт на подписку для держателя карты. Без токена: страницу открывает сам клиент,
   * дальше его ведём на paymentUrl, а подписку включает колбэк OctōPAY.
   */
  paySubscription: (serial: string, input: BuyMonthsInput) =>
    api.request(invoiceSchema, `/v1/public/octopay/subscriptions/${encodeURIComponent(serial)}`, {
      method: "POST",
      body: buyMonthsInputSchema.parse(input),
      anonymous: true,
    }),
});
