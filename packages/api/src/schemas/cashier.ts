import { z } from "zod";
import { phoneSchema } from "./phone";

/**
 * Web-кассир филиала (docs/07-partner-cashiers.md). Партнёр — администратор своего филиала
 * и заводит кассиров по имени и телефону; филиал сервер берёт из аккаунта партнёра.
 * Кассир (роль partner_employee) видит только обзор филиала, списание и свою историю.
 * Контракт — docs/API.md, «Web-кассир филиала».
 */

const named = z.looseObject({ id: z.string().nullish(), name: z.string().nullish() });

/** Обзор филиала: кто вошёл, где работает и принимает ли заведение бонусы. */
export const cashierOverviewSchema = z.looseObject({
  cashier: z.looseObject({ memberId: z.string().nullish(), fullName: z.string().nullish() }).nullish(),
  branch: named.nullish(),
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

/**
 * Кассир в списке партнёра. Номер заводят заранее: до первого входа по коду —
 * registrationStatus "pending", после — "registered" и registeredAt.
 */
export const cashierSchema = z.looseObject({
  memberId: z.string(),
  userId: z.string().nullish(),
  fullName: z.string().nullish(),
  phone: z.string().nullish(),
  active: z.boolean().nullish(),
  registrationStatus: z.enum(["pending", "registered"]).nullish(),
  registeredAt: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Cashier = z.infer<typeof cashierSchema>;

/** Новый кассир: имя и телефон — по нему он потом входит кодом из WhatsApp. */
export const createCashierInputSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя").max(80, "Слишком длинное имя"),
  phone: phoneSchema,
});
export type CreateCashierInput = z.infer<typeof createCashierInputSchema>;
