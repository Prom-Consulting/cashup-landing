import { z } from "zod";
import type { ApiClient } from "../http";
import {
  launchOfferInputSchema,
  launchOfferSchema,
  merchantTariffPlanSchema,
  publicTariffsSchema,
  tariffPriceInputSchema,
  type LaunchOfferInput,
  type TariffPriceInput,
} from "../schemas/tariffs";

/** Цены тарифов бизнеса — только агентству. Смена пишется в журнал как tariff.price_updated. */
export const tariffsApi = (api: ApiClient) => ({
  list: () => api.request(z.array(merchantTariffPlanSchema), "/admin/v1/tariffs"),

  setPrice: (code: string, input: TariffPriceInput) =>
    api.request(merchantTariffPlanSchema, `/admin/v1/tariffs/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: tariffPriceInputSchema.parse(input),
    }),

  /** Акция запуска: места, сколько занято и бесплатные месяцы. */
  launchOffer: () => api.request(launchOfferSchema, "/admin/v1/tariffs/launch-offer"),

  setLaunchOffer: (input: LaunchOfferInput) =>
    api.request(launchOfferSchema, "/admin/v1/tariffs/launch-offer", {
      method: "PATCH",
      body: launchOfferInputSchema.parse(input),
    }),

  /** Цены и свободные места для лендинга — без входа. */
  publicList: () => api.request(publicTariffsSchema, "/v1/public/tariffs", { anonymous: true }),
});
