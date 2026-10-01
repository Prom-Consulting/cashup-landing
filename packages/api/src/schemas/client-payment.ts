import { z } from "zod";

/**
 * Счёт клиенту через OctōPAY: клиент сам выбирает сумму бонусов Loal, а остаток оплачивает
 * банком. Выставляют владелец, администратор филиала и кассир.
 */
export const clientPaymentInputSchema = z.object({
  requestId: z.uuid("Не удалось создать идентификатор запроса"),
  amount: z.coerce
    .number({ error: "Введите сумму" })
    .positive("Сумма больше нуля")
    .max(100_000_000, "Слишком большая сумма")
    .refine((value) => {
      const scaled = value * 100;
      const minor = Math.round(scaled);
      return Number.isSafeInteger(minor) && Math.abs(scaled - minor) <= 1e-7;
    }, "Сумма должна содержать не больше двух знаков после запятой"),
});
export type ClientPaymentInput = { requestId: string; amount: number | string };

/** Счёт клиенту. Статус строкой: незнакомый не должен ронять список. */
export const clientPaymentSchema = z.looseObject({
  id: z.string(),
  amount: z.number().nullish(),
  status: z.string().nullish(),
  paymentUrl: z.string().nullish(),
  clientPhone: z.string().nullish(),
  customerName: z.string().nullish(),
  cashierName: z.string().nullish(),
  branchName: z.string().nullish(),
  createdAt: z.string().nullish(),
  paidAt: z.string().nullish(),
});
export type ClientPayment = z.infer<typeof clientPaymentSchema>;

export const CLIENT_PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "ждёт оплаты",
  paid: "оплачен",
  failed: "не прошёл",
  cancelled: "отменён",
  expired: "истёк",
};
