import { z } from "zod";
import type { ApiClient } from "../http";
import { merchantTariffPlanSchema, tariffPriceInputSchema, type TariffPriceInput } from "../schemas/tariffs";

/** Цены тарифов бизнеса — только агентству. Смена пишется в журнал как tariff.price_updated. */
export const tariffsApi = (api: ApiClient) => ({
  list: () => api.request(z.array(merchantTariffPlanSchema), "/admin/v1/tariffs"),

  setPrice: (code: string, input: TariffPriceInput) =>
    api.request(merchantTariffPlanSchema, `/admin/v1/tariffs/${encodeURIComponent(code)}`, {
      method: "PATCH",
      body: tariffPriceInputSchema.parse(input),
    }),
});
