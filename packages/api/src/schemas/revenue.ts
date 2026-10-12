import { z } from "zod";

/**
 * Деньги (docs/API.md, «Деньги»): откуда у заведения доступ к бонусам и платит ли оно.
 * octopay_paid / octopay_trial / octopay_unlimited — пакет оплачивается в OctōPAY;
 * octopay_unknown — OctōPAY ещё не сообщает о подписке; loal_paid — своя подписка Loal,
 * хоть раз оплаченная; loal_free — подписка выдана руками или промокодом; none — доступа нет.
 */
export const MERCHANT_ACCESS = [
  "octopay_paid",
  "octopay_trial",
  "octopay_unlimited",
  "octopay_unknown",
  "loal_paid",
  "loal_free",
  "none",
] as const;
export type MerchantAccess = (typeof MERCHANT_ACCESS)[number];

export const MERCHANT_ACCESS_LABELS: Record<MerchantAccess, string> = {
  octopay_paid: "OctōPAY оплачен",
  octopay_trial: "Пробный OctōPAY",
  octopay_unlimited: "OctōPAY безлимит",
  octopay_unknown: "OctōPAY: нет данных",
  loal_paid: "Loal оплачен",
  loal_free: "Бесплатно",
  none: "Не оплачено",
};

const moneySchema = z.looseObject({
  paidTotal: z.number(),
  paidCount: z.number(),
  paid30d: z.number(),
  pending30d: z.number(),
});

export const revenueMerchantSchema = z.looseObject({
  merchantId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  tariff: z.string(),
  /** Строкой: новый вид доступа не должен ронять экран. */
  access: z.string(),
  octopay: z.looseObject({
    subscriptionActive: z.boolean().nullable(),
    level: z.string().nullable(),
    endsAt: z.string().nullable(),
    checkedAt: z.string().nullable(),
  }),
  loal: z.looseObject({
    subscriptionUntil: z.string().nullable(),
    paidCount: z.number(),
    paidTotal: z.number(),
    lastPaidAt: z.string().nullable(),
    pendingInvoices: z.number(),
    grantedMonths: z.number(),
    promoMonths: z.number(),
  }),
});
export type RevenueMerchant = z.infer<typeof revenueMerchantSchema>;

export const revenueReportSchema = z.looseObject({
  merchants: z.array(revenueMerchantSchema),
  byAccess: z.record(z.string(), z.number()),
  money: z.looseObject({ merchants: moneySchema, clients: moneySchema }),
});
export type RevenueReport = z.infer<typeof revenueReportSchema>;
