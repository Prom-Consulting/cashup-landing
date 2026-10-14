import { z } from "zod";

/**
 * Кэшбэк на кассе (Доп. №5): «Больше клиентов» и «Очень много клиентов». Кассир сканирует
 * карту и вводит сумму покупки деньгами — клиент получает процент бонусами (процент и дневной
 * предел задаёт агентство). `operationId` — UUID попытки: повтор с ним не начислит второй раз.
 */
export const tillCashbackInputSchema = z.object({
  cardSerialNumber: z.string().trim().min(1, "Отсканируйте карту или введите номер"),
  amount: z.coerce
    .number({ error: "Введите сумму покупки" })
    .positive("Сумма больше нуля")
    .max(10_000_000, "Слишком большая сумма")
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, "Не больше двух знаков после запятой"),
  operationId: z.string().uuid(),
});
export type TillCashbackForm = { cardSerialNumber: string; amount: number | string; operationId: string };

export const tillCashbackResultSchema = z.looseObject({
  /** Сколько бонусов начислено этой операцией. */
  points: z.number(),
  /** Баланс карты сразу после. */
  balance: z.number(),
  /** Дневной предел урезал кэшбэк. */
  capped: z.boolean().nullish(),
});
export type TillCashbackResult = z.infer<typeof tillCashbackResultSchema>;

/** Настройки агентства: процент от покупки и предел бонусов одному клиенту в день в одном заведении. */
export const cashbackSettingsSchema = z.looseObject({ percent: z.number(), dailyCap: z.number() });
export type CashbackSettings = z.infer<typeof cashbackSettingsSchema>;

export const cashbackSettingsInputSchema = z.object({
  percent: z.coerce
    .number({ error: "Введите процент" })
    .positive("Больше нуля")
    .max(100, "Не больше 100%")
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, "Не больше двух знаков после запятой"),
  dailyCap: z.coerce.number({ error: "Введите число бонусов" }).int("Целое число").positive("Больше нуля").max(1_000_000, "Слишком много"),
});
export type CashbackSettingsInput = { percent: number | string; dailyCap: number | string };

/** Что разрешает тариф на кассе. Без тарифа (подключены раньше) — только списание. */
export function tariffAbilities(businessTariff: string | null | undefined) {
  return {
    redeem: businessTariff !== "cashback",
    cashback: businessTariff === "cashback" || businessTariff === "full",
  };
}

/** Строка журнала кэшбэка заведения (`GET /admin/v1/merchants/{id}/cashback`). */
export const cashbackJournalRowSchema = z.looseObject({
  id: z.string(),
  customerName: z.string(),
  cashierName: z.string().nullish(),
  purchaseAmount: z.number(),
  percent: z.number().nullish(),
  points: z.number(),
  capped: z.boolean().nullish(),
  createdAt: z.string(),
});
export type CashbackJournalRow = z.infer<typeof cashbackJournalRowSchema>;

export const cashbackJournalPageSchema = z.looseObject({
  items: z.array(cashbackJournalRowSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type CashbackJournalPage = z.infer<typeof cashbackJournalPageSchema>;
