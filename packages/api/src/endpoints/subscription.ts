import type { ApiClient } from "../http";
import { publicSubscriptionOfferSchema } from "../schemas/me";

/** Цена подписки без входа — для лендинга и оформления первой карты. */
export const subscriptionApi = (api: ApiClient) => ({
  publicOffer: () =>
    api.request(publicSubscriptionOfferSchema, "/v1/public/subscription/offer", { anonymous: true }),
});
