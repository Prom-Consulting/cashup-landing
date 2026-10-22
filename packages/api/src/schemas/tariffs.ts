import { z } from "zod";

/** Тарифы бизнеса, которые продаёт Loal: цены — у агентства, экран «Тарифы». */
export const merchantTariffPlanSchema = z.looseObject({
  /** loal — «Только Loal» (счёт выставляет Loal), loal_octopay — цену читает OctōPAY. */
  code: z.string(),
  name: z.string().nullish(),
  /** Целые сомы за месяц; 0 — бесплатно. */
  priceKgs: z.number(),
  regularPriceKgs: z.number().optional(),
  freeMerchantLimit: z.number().int().nonnegative().optional(),
  enrolledMerchants: z.number().int().nonnegative().optional(),
  freePlacesRemaining: z.number().int().nonnegative().optional(),
  freeOfferActive: z.boolean().optional(),
  updatedAt: z.string().nullish(),
});
export type MerchantTariffPlan = z.infer<typeof merchantTariffPlanSchema>;

export const publicMerchantTariffSchema = merchantTariffPlanSchema.extend({
  code: z.enum(["loal", "loal_octopay"]),
  regularPriceKgs: z.number().int().nonnegative(),
  freeMerchantLimit: z.number().int().nonnegative(),
  enrolledMerchants: z.number().int().nonnegative(),
  freePlacesRemaining: z.number().int().nonnegative(),
  freeOfferActive: z.boolean(),
  currency: z.literal("KGS"),
  period: z.literal("month"),
});
export type PublicMerchantTariff = z.infer<typeof publicMerchantTariffSchema>;

export const tariffPriceInputSchema = z.object({
  priceKgs: z.union([z.number(), z.string().trim().min(1, "Введите цену")]).pipe(z.coerce
    .number<number | string>({ error: "Введите цену числом" })
    .int("Целые сомы, без тыйынов")
    .min(0, "Не меньше нуля: 0 — бесплатно")
    .max(10_000_000, "Слишком большая цена")),
  freeMerchantLimit: z.union([z.number(), z.string().trim().min(1, "Введите лимит")]).pipe(z.coerce
    .number<number | string>({ error: "Введите количество числом" })
    .int("Введите целое количество заведений")
    .min(0, "Не меньше нуля")
    .max(1_000_000, "Слишком большой лимит")).optional(),
});
export type TariffPriceInput = { priceKgs: number | string; freeMerchantLimit?: number | string };
