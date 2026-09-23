import { z } from "zod";
import type { ApiClient } from "../http";
import {
  buyMonthsInputSchema,
  createInvoiceInputSchema,
  invoiceSchema,
  onecIntegrationSchema,
  storeSubscriptionSchema,
  type BuyMonthsInput,
  type CreateInvoiceInput,
} from "../schemas/billing";
import { deductionPageSchema } from "../schemas/deduction";

export type DeductionQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  from?: string;
  to?: string;
};

/**
 * Кабинет магазина: журнал списаний, подписка (можно ли принимать бонусы),
 * счета и настройки обмена с 1С. Один и тот же адрес обслуживает и агентство:
 * магазин видит свой storeId, super_admin — любой.
 */
export const storeCabinetApi = (api: ApiClient) => ({
  deductions: (storeId: string, query: DeductionQuery = {}) =>
    api.request(deductionPageSchema, `/admin/v1/stores/${storeId}/deductions`, { query }),

  subscription: (storeId: string) => api.request(storeSubscriptionSchema, `/admin/v1/stores/${storeId}/subscription`),

  /** Выдача доступа агентством без оплаты. Обычный путь продления — через счёт. */
  grantSubscription: (storeId: string, input: BuyMonthsInput) =>
    api.request(storeSubscriptionSchema, `/admin/v1/stores/${storeId}/subscription`, {
      method: "POST",
      body: buyMonthsInputSchema.parse(input),
    }),

  invoices: (storeId: string) => api.request(z.array(invoiceSchema), `/admin/v1/stores/${storeId}/payments`),

  createInvoice: (storeId: string, input: CreateInvoiceInput) =>
    api.request(invoiceSchema, `/admin/v1/stores/${storeId}/payments`, {
      method: "POST",
      body: createInvoiceInputSchema.parse(input),
    }),

  onecIntegration: (storeId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/stores/${storeId}/onec-integration`),

  /** Перевыпуск токена немедленно ломает прежний адрес вебхука. */
  regenerateOnecToken: (storeId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/stores/${storeId}/onec-integration/regenerate-token`, {
      method: "POST",
      body: {},
    }),
});
