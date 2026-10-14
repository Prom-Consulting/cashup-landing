import { z } from "zod";

/** Тарифы бизнеса, которые продаёт Loal: цены — у агентства, экран «Тарифы». */
export const merchantTariffPlanSchema = z.looseObject({
  /** more_clients | even_more_clients | very_many_clients (LOAL_TARIFFS). */
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

/**
 * Тарифы Loal (ТЗ №5, `loalTariff` у магазина, подписки, кассы и в каталоге). Решают цену,
 * можно ли тратить бонусы в точке и даёт ли она кэшбэк. Цены — с сервера (`/admin/v1/tariffs`).
 */
export const LOAL_TARIFFS = ["more_clients", "even_more_clients", "very_many_clients"] as const;
export type LoalTariff = (typeof LOAL_TARIFFS)[number];

export const LOAL_TARIFF_LABELS: Record<LoalTariff, { title: string; about: string }> = {
  more_clients: { title: "Больше клиентов", about: "Клиенты получают у вас кэшбэк и тратят бонусы у других партнёров." },
  even_more_clients: { title: "Ещё больше клиентов", about: "Клиенты оплачивают часть чека бонусами, кэшбэка нет." },
  very_many_clients: {
    title: "Очень много клиентов",
    about: "И оплата бонусами, и кэшбэк, плюс выделение в каталоге.",
  },
};

export const isLoalTariff = (value: unknown): value is LoalTariff =>
  typeof value === "string" && (LOAL_TARIFFS as readonly string[]).includes(value);
