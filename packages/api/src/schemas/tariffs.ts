import { z } from "zod";

/** Тарифы бизнеса, которые продаёт Loal: цены — у агентства, экран «Тарифы». */
export const merchantTariffPlanSchema = z.looseObject({
  /** loal — «Только Loal» (счёт выставляет Loal), loal_octopay — цену читает OctōPAY. */
  code: z.string(),
  name: z.string().nullish(),
  /** Целые сомы за месяц; 0 — бесплатно. */
  priceKgs: z.number(),
  updatedAt: z.string().nullish(),
});
export type MerchantTariffPlan = z.infer<typeof merchantTariffPlanSchema>;

export const tariffPriceInputSchema = z.object({
  priceKgs: z.coerce
    .number({ error: "Введите цену числом" })
    .int("Целые сомы, без тыйынов")
    .min(0, "Не меньше нуля: 0 — бесплатно")
    .max(10_000_000, "Слишком большая цена"),
});
export type TariffPriceInput = { priceKgs: number | string };
