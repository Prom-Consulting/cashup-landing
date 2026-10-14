import { z } from "zod";
import type { LoalTariff } from "./tariffs";

/**
 * Кэшбэк на кассе (ТЗ №5) — прежнее «начисление по сумме чека»
 * `POST /v1/cards/{serial}/scan-confirm { purchaseAmount, branchId? }`: сервер сам считает его по
 * проценту кэшбэка магазина. «Ещё больше клиентов» — `403 TARIFF_NO_CASHBACK`, доступ не оплачен —
 * `403 MERCHANT_ACCESS_INACTIVE`. Ключа повтора у операции нет: кнопка блокируется на время запроса.
 */
export const tillCashbackInputSchema = z.object({
  cardSerialNumber: z.string().trim().min(1, "Отсканируйте карту или введите номер"),
  amount: z.coerce
    .number({ error: "Введите сумму покупки" })
    .positive("Сумма больше нуля")
    .max(10_000_000, "Слишком большая сумма")
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, "Не больше двух знаков после запятой"),
});
export type TillCashbackForm = { cardSerialNumber: string; amount: number | string };

/** Ответ scan-confirm: запись журнала (сколько начислено и баланс после). `card` — сырая строка БД, её не читаем. */
export const tillCashbackResultSchema = z.looseObject({
  transaction: z.looseObject({ amount: z.coerce.number(), balanceAfter: z.coerce.number() }),
});
export type TillCashbackResult = z.infer<typeof tillCashbackResultSchema>;

/** Процент кэшбэка партнёра — только агентству. `percent: null` — по умолчанию (`defaultPercent`). */
export const cashbackPercentSchema = z.looseObject({
  percent: z.number().nullable(),
  defaultPercent: z.number(),
  /** Что получит клиент сейчас; null — тариф кэшбэк не даёт. */
  effectivePercent: z.number().nullable(),
});
export type CashbackPercent = z.infer<typeof cashbackPercentSchema>;

export const cashbackPercentInputSchema = z.object({
  percent: z.union([
    z.literal(""),
    z.coerce.number({ error: "Введите процент" }).int("Целое число").min(0, "Не меньше 0").max(100, "Не больше 100"),
  ]),
});
export type CashbackPercentInput = { percent: number | string };

/**
 * Что разрешает тариф на кассе: «Больше клиентов» — только кэшбэк, «Ещё больше» — только списание,
 * «Очень много» — оба. Без поля (старый шлюз) — как «Очень много»: на него перевели всех прежних.
 */
export function tariffAbilities(loalTariff: LoalTariff | string | null | undefined) {
  return {
    redeem: loalTariff !== "more_clients",
    cashback: loalTariff !== "even_more_clients",
  };
}
