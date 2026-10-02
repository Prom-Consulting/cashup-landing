import { z } from "zod";

/**
 * Кабинет кассира (docs/API.md, «Кабинет кассира»): кассир (staff) и администратор филиала
 * видят обзор, свою историю списаний и списывают. Человек — из токена.
 */

const named = z.looseObject({ id: z.string().nullish(), name: z.string().nullish() });

/** Обзор филиала: кто вошёл, где работает и принимает ли заведение бонусы. */
export const cashierOverviewSchema = z.looseObject({
  cashier: z.looseObject({ memberId: z.string().nullish(), fullName: z.string().nullish() }).nullish(),
  /** Единственный филиал; null, если филиалов нет или их несколько. */
  branch: named.nullish(),
  /** Все доступные филиалы: при нескольких кассир выбирает, на какой записать операцию. */
  branches: z.array(z.looseObject({ id: z.string(), name: z.string().nullish() })).default([]),
  merchant: named.nullish(),
  /** null — у заведения нет подписки, бонусы не принимаются. */
  subscription: z
    .looseObject({
      status: z.string().nullish(),
      expiresAt: z.string().nullish(),
      isActive: z.boolean().nullish(),
    })
    .nullish(),
  permissions: z.looseObject({ redeem: z.boolean().nullish() }).nullish(),
  /** octopay — есть «Счёт клиенту» через OctōPAY; loal — только касса. */
  tariff: z.string().nullish(),
});
export type CashierOverview = z.infer<typeof cashierOverviewSchema>;

/** Своё списание кассира: только имя клиента, сумма и когда — ни телефона, ни чужих операций. */
export const cashierRedemptionSchema = z.looseObject({
  id: z.string(),
  customerName: z.string().nullish(),
  txType: z.string().nullish(),
  amount: z.number(),
  createdAt: z.string(),
});
export type CashierRedemption = z.infer<typeof cashierRedemptionSchema>;

export const cashierRedemptionPageSchema = z.looseObject({
  items: z.array(cashierRedemptionSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type CashierRedemptionPage = z.infer<typeof cashierRedemptionPageSchema>;

export type CashierRedemptionQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "amount" | "customerName";
  sortDir?: "asc" | "desc";
};
