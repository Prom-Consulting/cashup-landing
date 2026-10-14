import { z } from "zod";

/** Тарифы бизнеса, которые продаёт Loal: цены — у агентства, экран «Тарифы». */
export const merchantTariffPlanSchema = z.looseObject({
  /** loal — «Только Loal» (счёт выставляет Loal), loal_octopay — цену читает OctōPAY. */
  code: z.string(),
  name: z.string().nullish(),
  /** Целые сомы за месяц; 0 — бесплатно. */
  priceKgs: z.number(),
  /** false — старый тариф («Только Loal», «Loal + OctoPAY») для подключённых до Доп. №5. */
  current: z.boolean().nullish(),
  /** Тариф участвует в акции «первые места бесплатно». */
  launchOffer: z.boolean().nullish(),
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

/**
 * Тарифы бизнеса по Доп. №5: что получает бизнес, а не связь с OctōPAY. Цены — с сервера,
 * здесь только названия и стикер в точке.
 */
export const BUSINESS_TARIFFS = ["cashback", "redeem", "full"] as const;
export type BusinessTariff = (typeof BUSINESS_TARIFFS)[number];

export const BUSINESS_TARIFF_LABELS: Record<BusinessTariff, { title: string; sticker: string }> = {
  cashback: { title: "Больше клиентов", sticker: "оранжевый стикер" },
  redeem: { title: "Ещё больше клиентов", sticker: "чёрный стикер" },
  full: { title: "Очень много клиентов", sticker: "белый стикер" },
};

export const isBusinessTariff = (value: unknown): value is BusinessTariff =>
  typeof value === "string" && (BUSINESS_TARIFFS as readonly string[]).includes(value);

/** Акция запуска: первые места на нижних тарифах бесплатны столько-то месяцев. */
export const launchOfferSchema = z.looseObject({
  /** Бесплатные месяцы; 0 — акция выключена. */
  months: z.number(),
  /** Мест всего, занятые тоже. */
  seats: z.number(),
  /** Занято — только у агентства. */
  taken: z.number().nullish(),
  left: z.number(),
  tariffs: z.array(z.string()),
});
export type LaunchOffer = z.infer<typeof launchOfferSchema>;

/** `GET /v1/public/tariffs` — для лендинга, без входа. */
export const publicTariffsSchema = z.looseObject({
  tariffs: z.array(
    z.looseObject({ code: z.string(), name: z.string().nullish(), priceKgs: z.number(), launchOffer: z.boolean().nullish() }),
  ),
  launchOffer: launchOfferSchema,
});
export type PublicTariffs = z.infer<typeof publicTariffsSchema>;

export const launchOfferInputSchema = z.object({
  seats: z.coerce.number({ error: "Введите число мест" }).int("Целое число").min(0, "Не меньше нуля").max(100_000, "Слишком много"),
  months: z.coerce
    .number({ error: "Введите число месяцев" })
    .int("Целое число месяцев")
    .min(0, "0 — акция выключена")
    .max(120, "Не больше 120 месяцев"),
});
export type LaunchOfferInput = { seats: number | string; months: number | string };
