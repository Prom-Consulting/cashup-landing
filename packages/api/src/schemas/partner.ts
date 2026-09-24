import { z } from "zod";
import { phoneSchema } from "./auth";

/**
 * Партнёрский кабинет: ключ к адресам — не магазин, а сам партнёр (memberId).
 * Партнёру выбирают одну операцию навсегда, его сотрудники наследуют ровно её.
 */

/** Операция партнёра по его списку прав: начисляет или списывает. */
export function partnerOperation(permissions: Record<string, boolean> | undefined): "earn" | "redeem" | null {
  if (permissions?.scan_earn) return "earn";
  if (permissions?.scan_redeem) return "redeem";
  return null;
}

/** Строка «Оплаты» партнёра: без телефона клиента — только имя, сумма и когда. */
export const partnerPaymentSchema = z.looseObject({
  id: z.string(),
  customerName: z.string().nullish(),
  txType: z.enum(["earn", "redeem"]),
  amount: z.number(),
  createdAt: z.string(),
});
export type PartnerPayment = z.infer<typeof partnerPaymentSchema>;

export const partnerPaymentPageSchema = z.looseObject({
  items: z.array(partnerPaymentSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type PartnerPaymentPage = z.infer<typeof partnerPaymentPageSchema>;

export type PartnerPaymentQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "createdAt" | "amount" | "customerName";
  sortDir?: "asc" | "desc";
};

/** Сотрудник партнёра заводится по userId — операцию он наследует, выбирать нечего. */
export const addEmployeeInputSchema = z.object({
  userId: z.string().trim().uuid("Это не похоже на идентификатор пользователя"),
});
export type AddEmployeeInput = z.infer<typeof addEmployeeInputSchema>;

/**
 * Счёт клиенту через OctōPAY: когда он оплатит, бонусы спишутся с его карты сами,
 * без кассира — в журнале это одна строка «Оплата через OctōPAY».
 */
export const partnerInvoiceInputSchema = z.object({
  clientPhone: phoneSchema,
  amount: z.coerce
    .number({ error: "Введите сумму" })
    .positive("Сумма больше нуля")
    .max(100_000_000, "Слишком большая сумма"),
});
export type PartnerInvoiceInput = { clientPhone: string; amount: number | string };
