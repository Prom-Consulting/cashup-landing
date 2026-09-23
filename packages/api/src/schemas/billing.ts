import { z } from "zod";

/**
 * Подписка магазина отвечает на вопрос «можно ли принимать бонусы»,
 * счёт — «заплатили ли». Это разные сущности и разные адреса (docs/API.md).
 */
export const storeSubscriptionSchema = z.looseObject({
  storeId: z.string(),
  plan: z.string().nullish(),
  status: z.string(),
  startedAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
  isActive: z.boolean(),
});
export type StoreSubscription = z.infer<typeof storeSubscriptionSchema>;

/** Подписка клиента: пачка баллов на период, остаток в конце месяца сгорает. */
export const cardSubscriptionSchema = z.looseObject({
  id: z.string(),
  storeId: z.string(),
  cardId: z.string(),
  status: z.enum(["active", "canceled", "expired"]),
  pointsPerPeriod: z.number(),
  periodsTotal: z.number(),
  periodsGranted: z.number(),
  currentPeriodStart: z.string().nullish(),
  currentPeriodEnd: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type CardSubscription = z.infer<typeof cardSubscriptionSchema>;

/** Счёт на оплату: pending — ждёт оплаты, paid — оплачен, cancelled — отменён. */
export const invoiceStatusSchema = z.enum(["pending", "paid", "cancelled"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const invoiceSchema = z.looseObject({
  id: z.string(),
  amount: z.number().nullish(),
  months: z.number().nullish(),
  /** Строкой, а не enum: незнакомый статус не должен ронять экран оплаты. */
  status: z.string().nullish(),
  paymentUrl: z.string().nullish(),
  providerInvoiceId: z.string().nullish(),
  product: z.string().nullish(),
  paidAt: z.string().nullish(),
  expiresAt: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Invoice = z.infer<typeof invoiceSchema>;

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: "Ждёт оплаты",
  paid: "Оплачен",
  cancelled: "Отменён",
};

/**
 * Состояние счёта для экрана: подпись, тон метки и можно ли платить.
 * Просроченную ссылку считаем отдельно — заплатить по ней уже нельзя.
 */
export function invoiceState(invoice: Invoice) {
  const status = invoice.status ?? "pending";
  const expired =
    status === "pending" && Boolean(invoice.expiresAt) && new Date(invoice.expiresAt!).getTime() < Date.now();

  if (status === "paid") return { label: "Оплачен", tone: "good" as const, payable: false };
  if (status === "cancelled") return { label: "Отменён", tone: "quiet" as const, payable: false };
  if (expired) return { label: "Ссылка истекла", tone: "quiet" as const, payable: false };
  if (status === "pending")
    return { label: "Ждёт оплаты", tone: "warn" as const, payable: Boolean(invoice.paymentUrl) };
  return { label: status, tone: "neutral" as const, payable: Boolean(invoice.paymentUrl) };
}

/** Коды тарифов бэкенда в человеческие слова; незнакомый код показываем как есть. */
const PLAN_LABELS: Record<string, string> = {
  monthly: "Помесячно",
  yearly: "На год",
  annual: "На год",
  trial: "Пробный",
  free: "Бесплатный",
};

export function planLabel(plan: string | null | undefined) {
  if (!plan) return "—";
  return PLAN_LABELS[plan] ?? plan;
}

export const buyMonthsInputSchema = z.object({
  months: z.coerce.number().int().min(1, "Минимум месяц").max(12, "Не больше года"),
});
export type BuyMonthsInput = z.infer<typeof buyMonthsInputSchema>;

export const createInvoiceInputSchema = z.object({
  amount: z.coerce.number().positive("Сумма больше нуля"),
  months: z.coerce.number().int().min(1, "Минимум месяц").max(12, "Не больше года"),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

/** Настройки обмена с 1С: адрес входящего вебхука копируют в 1С магазина. */
export const onecIntegrationSchema = z.looseObject({
  storeId: z.string(),
  inboundWebhookUrl: z.string(),
  createdAt: z.string().nullish(),
});
export type OnecIntegration = z.infer<typeof onecIntegrationSchema>;
