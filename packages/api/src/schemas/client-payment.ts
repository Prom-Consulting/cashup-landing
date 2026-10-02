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
  /** Филиал счёта: обязателен, если у человека их несколько (`400 BRANCH_REQUIRED`). */
  branchId: z.string().optional(),
});
export type ClientPaymentInput = { requestId: string; amount: number | string; branchId?: string };

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
  /** Срок оплаты ожидающего счёта; подтверждённый paid важнее прошедшего срока. */
  expiresAt: z.string().nullish(),
  /** Номер счёта OctōPAY — по нему кассир сверяет оплату. */
  providerInvoiceId: z.string().nullish(),
  /** merchant — выставил сотрудник, self_service — покупатель сам по NFC/QR. Нет поля — merchant. */
  source: z.string().nullish(),
  branchId: z.string().nullish(),
  checkoutPointId: z.string().nullish(),
  checkoutPointName: z.string().nullish(),
  /** Итоговые части после финального события; null — «ещё не подтверждено», не ноль. */
  bonusAmount: z.number().nullish(),
  bankAmount: z.number().nullish(),
  /** Обе части завершены. Оплачен — только status paid и fulfilled true. */
  fulfilled: z.boolean().nullish(),
});
export type ClientPayment = z.infer<typeof clientPaymentSchema>;

export const isSelfServicePayment = (payment: Pick<ClientPayment, "source">) => payment.source === "self_service";

/**
 * Итог счёта по серверу: оплачен — только paid и fulfilled (старый ответ без fulfilled —
 * по статусу). paid без fulfilled — деньги пришли, бонусная часть ещё завершается.
 */
export function clientPaymentOutcome(payment: Pick<ClientPayment, "status" | "fulfilled">) {
  if (payment.status === "paid") return payment.fulfilled === false ? "finishing" : "paid";
  return payment.status ?? "pending";
}

export const CLIENT_PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "ждёт оплаты",
  finishing: "оплачен, завершаем",
  paid: "оплачен",
  failed: "не прошёл",
  cancelled: "отменён",
  expired: "истёк",
};

/**
 * Касса самостоятельной оплаты: постоянная ссылка для NFC-метки и QR. Покупатель сам вводит
 * сумму и выбирает процент из coveragePercents (docs/octopay.md). Кроме включения, точку не
 * меняют: для другой настройки создают новую и отключают старую.
 */
export const checkoutPointSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  branchId: z.string().nullish(),
  publicCode: z.string().nullish(),
  coveragePercents: z.array(z.number()).default([]),
  isActive: z.boolean().default(true),
  url: z.string().nullish(),
});
export type CheckoutPoint = z.infer<typeof checkoutPointSchema>;

/** Ответ списка: массив или { points } — принимаем оба. */
export const checkoutPointListSchema = z
  .union([z.array(checkoutPointSchema), z.looseObject({ points: z.array(checkoutPointSchema) })])
  .transform((value) => (Array.isArray(value) ? value : value.points));

export function checkoutPointInputSchema(maxPercent: number) {
  return z.object({
    name: z.string().trim().min(1, "Назовите кассу").max(120, "Не длиннее 120 символов"),
    branchId: z.string().min(1, "Выберите филиал"),
    coveragePercents: z
      .array(z.number().int().min(1).max(Math.min(100, maxPercent), `Не выше ${Math.min(100, maxPercent)}%`))
      .min(1, "Выберите хотя бы один процент")
      .max(20, "Не больше 20 вариантов"),
  });
}
export type CheckoutPointInput = { name: string; branchId: string; coveragePercents: number[] };
