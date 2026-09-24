import { z } from "zod";
import type { ApiClient } from "../http";
import { invoiceSchema } from "../schemas/billing";
import { merchantMemberSchema } from "../schemas/merchant";
import {
  addEmployeeInputSchema,
  partnerInvoiceInputSchema,
  partnerPaymentPageSchema,
  type AddEmployeeInput,
  type PartnerInvoiceInput,
  type PartnerPaymentQuery,
} from "../schemas/partner";

/**
 * Партнёрский кабинет. Ключ к адресам — сам партнёр (memberId), а не магазин:
 * доступны партнёру, о котором речь, и агентству.
 */
export const partnerSelfApi = (api: ApiClient) => ({
  /** Своя запись: операция, приветственный бонус, QR по умолчанию. */
  me: (memberId: string) => api.request(merchantMemberSchema, `/admin/v1/members/${memberId}`),

  employees: (memberId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/members/${memberId}/employees`),

  /** Сотрудник наследует единственную операцию партнёра — в теле только userId. */
  addEmployee: (memberId: string, input: AddEmployeeInput) =>
    api.request(merchantMemberSchema, `/admin/v1/members/${memberId}/employees`, {
      method: "POST",
      body: addEmployeeInputSchema.parse(input),
    }),

  /** Что прошло через сканер партнёра и его сотрудников. */
  payments: (memberId: string, query: PartnerPaymentQuery = {}) =>
    api.request(partnerPaymentPageSchema, `/admin/v1/partners/${memberId}/payments`, { query }),

  /** Счёт клиенту: оплатит — бонусы спишутся с его карты сами, без кассира. */
  invoiceClient: (memberId: string, input: PartnerInvoiceInput) =>
    api.request(invoiceSchema, `/admin/v1/members/${memberId}/octopay/payments`, {
      method: "POST",
      body: partnerInvoiceInputSchema.parse(input),
    }),

  /** Партнёр оплачивает свой доступ. Без токена: страницу оплаты открывает он сам. */
  payAccess: (memberId: string, months: number) =>
    api.request(invoiceSchema, `/v1/public/octopay/partners/${memberId}`, {
      method: "POST",
      body: { months },
      anonymous: true,
    }),
});
