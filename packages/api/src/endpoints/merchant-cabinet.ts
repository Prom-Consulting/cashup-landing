import { z } from "zod";
import type { ApiClient } from "../http";
import {
  buyMonthsInputSchema,
  createInvoiceInputSchema,
  invoiceSchema,
  merchantSubscriptionSchema,
  onecIntegrationSchema,
  type BuyMonthsInput,
  type CreateInvoiceInput,
} from "../schemas/billing";
import { deductionPageSchema } from "../schemas/deduction";
import { merchantProfileSchema, uploadedAssetSchema, type MerchantProfile } from "../schemas/merchant";

export type DeductionQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  from?: string;
  to?: string;
};

/**
 * Кабинет заведения: журнал списаний, подписка, счета, витрина и обмен с 1С.
 * Всё привязано к merchantId — платформенные клиенты и карты сюда не входят.
 */
export const merchantCabinetApi = (api: ApiClient) => ({
  deductions: (merchantId: string, query: DeductionQuery = {}) =>
    api.request(deductionPageSchema, `/admin/v1/merchants/${merchantId}/deductions`, { query }),

  subscription: (merchantId: string) =>
    api.request(merchantSubscriptionSchema, `/admin/v1/merchants/${merchantId}/subscription`),

  /** Выдача доступа агентством без оплаты. Обычный путь продления — через счёт. */
  grantSubscription: (merchantId: string, input: BuyMonthsInput) =>
    api.request(merchantSubscriptionSchema, `/admin/v1/merchants/${merchantId}/subscription`, {
      method: "POST",
      body: buyMonthsInputSchema.parse(input),
    }),

  invoices: (merchantId: string) => api.request(z.array(invoiceSchema), `/admin/v1/merchants/${merchantId}/payments`),

  createInvoice: (merchantId: string, input: CreateInvoiceInput) =>
    api.request(invoiceSchema, `/admin/v1/merchants/${merchantId}/payments`, {
      method: "POST",
      body: createInvoiceInputSchema.parse(input),
    }),

  profile: (merchantId: string) => api.request(merchantProfileSchema, `/admin/v1/merchants/${merchantId}/profile`),

  /** PUT заменяет профиль целиком: пропущенное поле — это 400, а не «оставить как было». */
  saveProfile: (merchantId: string, profile: MerchantProfile) =>
    api.request(merchantProfileSchema, `/admin/v1/merchants/${merchantId}/profile`, {
      method: "PUT",
      body: merchantProfileSchema.parse(profile),
    }),

  /** Картинка грузится отдельно и до сохранения профиля; в ответ приходит её адрес. */
  uploadAsset: (merchantId: string, slot: "merchantLogo" | "merchantPhoto", file: File) => {
    const body = new FormData();
    body.append("file", file);
    return api.request(uploadedAssetSchema, `/admin/v1/merchants/${merchantId}/profile-assets`, {
      method: "POST",
      body,
      query: { slot },
    });
  },

  onecIntegration: (merchantId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/merchants/${merchantId}/onec-integration`),

  /** Перевыпуск токена немедленно ломает прежний адрес вебхука. */
  regenerateOnecToken: (merchantId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/merchants/${merchantId}/onec-integration/regenerate-token`, {
      method: "POST",
      body: {},
    }),
});
