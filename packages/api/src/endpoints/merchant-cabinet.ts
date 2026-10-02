import { z } from "zod";
import type { ApiClient } from "../http";
import {
  clientPaymentInputSchema,
  clientPaymentSchema,
  type ClientPaymentInput,
} from "../schemas/client-payment";
import {
  buyMonthsInputSchema,
  connectOctopayInputSchema,
  createInvoiceInputSchema,
  invoiceSchema,
  merchantSubscriptionSchema,
  octopayIntegrationSchema,
  onecIntegrationSchema,
  type BuyMonthsInput,
  type ConnectOctopayInput,
  type CreateInvoiceInput,
} from "../schemas/billing";
import { deductionPageSchema } from "../schemas/deduction";
import {
  addMemberInputSchema,
  branchSchema,
  createBranchInputSchema,
  createWebhookInputSchema,
  posSettingsSchema,
  webhookDeliverySchema,
  webhookSchema,
  type AddMemberInput,
  type CreateBranchInput,
  type CreateWebhookInput,
} from "../schemas/merchant-ops";
import {
  coverageLimitInputSchema,
  coverageLimitSchema,
  merchantMemberSchema,
  merchantProfileSchema,
  uploadedAssetSchema,
  type CoverageLimitInput,
  type MerchantProfile,
} from "../schemas/merchant";

/** branchId — только этот филиал; администратору филиала сервер подставляет его филиал сам. */
export type DeductionQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  from?: string;
  to?: string;
  branchId?: string;
};

/**
 * Кабинет заведения: журнал списаний, подписка, счета, витрина и обмен с 1С.
 * Всё привязано к merchantId — платформенные клиенты и карты сюда не входят.
 */
/**
 * Филиалы в теле запроса так, чтобы его понял и прежний шлюз (одно поле branchId, строгая схема),
 * и новый (branchIds, а branchId — для совместимости; оба сразу — 400). Один филиал — branchId,
 * несколько — branchIds; ни одного — при замене branchId: null, при добавлении поле не шлём.
 */
function branchesBody(branchIds: string[], replace: boolean) {
  if (branchIds.length > 1) return { branchIds };
  if (branchIds.length === 1) return { branchId: branchIds[0] };
  return replace ? { branchId: null } : {};
}

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

  octopayIntegration: (merchantId: string) =>
    api.request(octopayIntegrationSchema, `/admin/v1/merchants/${merchantId}/octopay-integration`),

  /** Код краткоживущий: передаём только в теле этого запроса и не кладём в query cache. */
  connectOctopay: (merchantId: string, input: ConnectOctopayInput) =>
    api.request(octopayIntegrationSchema, `/admin/v1/merchants/${merchantId}/octopay-integration`, {
      method: "POST",
      body: connectOctopayInputSchema.parse(input),
    }),

  disconnectOctopay: (merchantId: string) =>
    api.request(z.undefined(), `/admin/v1/merchants/${merchantId}/octopay-integration`, {
      method: "DELETE",
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

  /** Потолок процента на позицию; каталог показывает его клиенту как «до N%». */
  coverageLimit: (merchantId: string) =>
    api.request(coverageLimitSchema, `/admin/v1/merchants/${merchantId}/coverage-limit`),

  /** Магазину — не чаще раза в месяц (иначе 409 с датой); агентство этим не связано. */
  saveCoverageLimit: (merchantId: string, input: CoverageLimitInput) => {
    const { maxCoveragePercent } = coverageLimitInputSchema.parse(input);
    return api.request(coverageLimitSchema, `/admin/v1/merchants/${merchantId}/coverage-limit`, {
      method: "PUT",
      body: { maxCoveragePercent: maxCoveragePercent === "" ? null : maxCoveragePercent },
    });
  },

  /** includeArchived — вместе с закрытыми: чтобы отчёт за прошлое назвал точку. */
  branches: (merchantId: string, includeArchived = false) =>
    api.request(z.array(branchSchema), `/admin/v1/merchants/${merchantId}/branches`, {
      query: includeArchived ? { includeArchived: true } : undefined,
    }),

  renameBranch: (merchantId: string, branchId: string, input: CreateBranchInput) =>
    api.request(branchSchema, `/admin/v1/merchants/${merchantId}/branches/${branchId}`, {
      method: "PATCH",
      body: createBranchInputSchema.parse(input),
    }),

  /** Закрыть, а не стереть: archivedAt. Пока в филиале люди — 409 BRANCH_HAS_MEMBERS. */
  archiveBranch: (merchantId: string, branchId: string) =>
    api.request(z.looseObject({}).or(z.null()).or(z.undefined()), `/admin/v1/merchants/${merchantId}/branches/${branchId}`, {
      method: "DELETE",
    }),

  createBranch: (merchantId: string, input: CreateBranchInput) =>
    api.request(branchSchema, `/admin/v1/merchants/${merchantId}/branches`, {
      method: "POST",
      body: createBranchInputSchema.parse(input),
    }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  /** По имени и телефону; администратор филиала добавляет только кассиров своего филиала. */
  addMember: (merchantId: string, input: AddMemberInput) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members`, {
      method: "POST",
      body: (() => {
        const { branchIds, ...rest } = addMemberInputSchema.parse(input);
        return { ...rest, ...branchesBody(branchIds, false) };
      })(),
    }),

  /**
   * Заменить филиалы человека целиком. Администратор филиалов меняет только свои назначения —
   * остальные сервер сохраняет. Права меняются со следующего входа: сессия человека гаснет.
   */
  updateMember: (
    merchantId: string,
    memberId: string,
    input: { branchIds: string[] },
  ) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}`, {
      method: "PATCH",
      body: branchesBody(input.branchIds, true),
    }),

  /** Подтвердить приглашённого: до этого он в списке, но доступа не имеет. */
  acceptMember: (merchantId: string, memberId: string) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}/accept`, {
      method: "POST",
      body: {},
    }),

  /**
   * Без branchId владелец закрывает членство целиком (человек сможет работать в другом
   * магазине), администратор филиалов снимает только свои назначения. С branchId — снять один
   * филиал; последний филиал администратора филиалов так не снять (400).
   */
  removeMember: (merchantId: string, memberId: string, options: { branchId?: string } = {}) =>
    api.request(
      z.looseObject({}).or(z.null()),
      `/admin/v1/merchants/${merchantId}/members/${memberId}${options.branchId ? `?branchId=${encodeURIComponent(options.branchId)}` : ""}`,
      { method: "DELETE" },
    ),

  /** Счёт клиенту: на странице Octopay клиент сам выбирает, сколько бонусов Loal использовать. */
  createClientPayment: (merchantId: string, input: ClientPaymentInput) =>
    api.request(clientPaymentSchema, `/admin/v1/merchants/${merchantId}/client-payments`, {
      method: "POST",
      body: clientPaymentInputSchema.parse(input),
    }),

  /** Последние 100: владелец — все, администратор филиала — своего филиала, кассир — свои. */
  clientPayments: (merchantId: string) =>
    api.request(z.array(clientPaymentSchema), `/admin/v1/merchants/${merchantId}/client-payments`),

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
