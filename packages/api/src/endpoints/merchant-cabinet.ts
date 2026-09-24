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
import {
  addMemberInputSchema,
  addPartnerInputSchema,
  branchSchema,
  createBranchInputSchema,
  createWebhookInputSchema,
  posSettingsSchema,
  webhookDeliverySchema,
  webhookSchema,
  type AddMemberInput,
  type AddPartnerInput,
  type CreateBranchInput,
  type CreateWebhookInput,
} from "../schemas/merchant-ops";
import { merchantMemberSchema } from "../schemas/merchant";
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

  branches: (merchantId: string) => api.request(z.array(branchSchema), `/admin/v1/merchants/${merchantId}/branches`),

  createBranch: (merchantId: string, input: CreateBranchInput) =>
    api.request(branchSchema, `/admin/v1/merchants/${merchantId}/branches`, {
      method: "POST",
      body: createBranchInputSchema.parse(input),
    }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  /** Сотрудника подключают по userId: он сначала регистрируется сам. */
  addMember: (merchantId: string, input: AddMemberInput) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members`, {
      method: "POST",
      body: addMemberInputSchema.parse(input),
    }),

  /** Партнёру выбирают одну операцию навсегда — отсюда отдельный адрес. */
  addPartner: (merchantId: string, input: AddPartnerInput) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/partners`, {
      method: "POST",
      body: addPartnerInputSchema.parse(input),
    }),

  updateMember: (merchantId: string, memberId: string, input: { branchId?: string | null }) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}`, {
      method: "PATCH",
      body: input,
    }),

  /** Приветственный бонус партнёра: обе величины шлём вместе, null очищает. */
  updatePartnerBonus: (
    merchantId: string,
    memberId: string,
    input: { amount: number | null; maxPerCustomer: number | null },
  ) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}/bonus`, {
      method: "PATCH",
      body: input,
    }),

  removeMember: (merchantId: string, memberId: string) =>
    api.request(z.looseObject({}).or(z.null()), `/admin/v1/merchants/${merchantId}/members/${memberId}`, {
      method: "DELETE",
    }),

  posSettings: (merchantId: string) =>
    api.request(z.array(posSettingsSchema), `/admin/v1/merchants/${merchantId}/pos-settings`),

  updatePosSettings: (merchantId: string, programId: string, body: Record<string, unknown>) =>
    api.request(posSettingsSchema, `/admin/v1/merchants/${merchantId}/pos-settings/${programId}`, {
      method: "PATCH",
      body,
    }),

  /** Возвращает настройки кассы к значениям по умолчанию. */
  resetPosSettings: (merchantId: string, programId: string) =>
    api.request(z.looseObject({}).or(z.null()), `/admin/v1/merchants/${merchantId}/pos-settings/${programId}`, {
      method: "DELETE",
    }),

  webhooks: (merchantId: string) => api.request(z.array(webhookSchema), `/admin/v1/merchants/${merchantId}/webhooks`),

  /** secret приходит один раз — показать его нужно сразу после создания. */
  createWebhook: (merchantId: string, input: CreateWebhookInput) =>
    api.request(webhookSchema, `/admin/v1/merchants/${merchantId}/webhooks`, {
      method: "POST",
      body: createWebhookInputSchema.parse(input),
    }),

  webhookDeliveries: (merchantId: string, webhookId: string) =>
    api.request(z.array(webhookDeliverySchema), `/admin/v1/merchants/${merchantId}/webhooks/${webhookId}/deliveries`),

  onecIntegration: (merchantId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/merchants/${merchantId}/onec-integration`),

  /** Перевыпуск токена немедленно ломает прежний адрес вебхука. */
  regenerateOnecToken: (merchantId: string) =>
    api.request(onecIntegrationSchema, `/admin/v1/merchants/${merchantId}/onec-integration/regenerate-token`, {
      method: "POST",
      body: {},
    }),
});
