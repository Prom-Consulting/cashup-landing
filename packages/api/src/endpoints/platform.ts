import { z } from "zod";
import type { ApiClient } from "../http";
import { cardSchema } from "../schemas/card";
import {
  auditLogSchema,
  certificateHealthSchema,
  certificateSchema,
  createProgramInputSchema,
  createTierInputSchema,
  issueCardByPhoneInputSchema,
  platformSettingsInputSchema,
  platformSettingsSchema,
  programSchema,
  templateSchema,
  tierSchema,
  type CreateProgramInput,
  type CreateTierInput,
  type IssueCardByPhoneInput,
  type PlatformSettingsInput,
} from "../schemas/platform";
import {
  createCustomerInputSchema,
  customerPageSchema,
  customerSchema,
  issueCardInputSchema,
  loyaltyProgramSchema,
  passTemplateSchema,
  type CreateCustomerInput,
  type IssueCardInput,
} from "../schemas/customer";

export type CustomerQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  archived?: boolean;
};

/**
 * Клиенты, карты, шаблоны и программы принадлежат платформе, а не заведению:
 * в адресах нет merchantId, а доступ есть только у агентства — остальным 403.
 */
export const platformApi = (api: ApiClient) => ({
  customers: (query: CustomerQuery = {}) => api.request(customerPageSchema, "/admin/v1/customers/table", { query }),

  createCustomer: (input: CreateCustomerInput) =>
    api.request(customerSchema, "/admin/v1/customers", {
      method: "POST",
      body: createCustomerInputSchema.parse(input),
    }),

  /** Архивация необратима: карты клиента отзываются тем же запросом. */
  archiveCustomer: (customerId: string) =>
    api.request(customerSchema, `/admin/v1/customers/${customerId}/archive`, { method: "POST", body: {} }),

  customerCards: (customerId: string) => api.request(z.array(cardSchema), `/admin/v1/customers/${customerId}/cards`),

  issueCard: (input: IssueCardInput) =>
    api.request(cardSchema, "/admin/v1/cards", { method: "POST", body: issueCardInputSchema.parse(input) }),

  revokeCard: (serial: string) =>
    api.request(cardSchema, `/admin/v1/cards/${encodeURIComponent(serial)}/revoke`, { method: "POST", body: {} }),

  /**
   * Выдать карту человеку. templateId и programId можно не слать — тогда выдаётся
   * карта платформы по умолчанию. Клиент заводится по телефону, если его ещё нет.
   */
  issueCardByPhone: (input: IssueCardByPhoneInput) =>
    api.request(cardSchema, "/admin/v1/cards", { method: "POST", body: issueCardByPhoneInputSchema.parse(input) }),

  /** Поставить уровень руками. */
  setCardTier: (serial: string, tierId: string) =>
    api.request(cardSchema, `/admin/v1/cards/${encodeURIComponent(serial)}/tier`, {
      method: "PATCH",
      body: { tierId },
    }),

  templates: () => api.request(z.array(templateSchema), "/admin/v1/templates"),

  publishTemplate: (templateId: string) =>
    api.request(templateSchema, `/admin/v1/templates/${templateId}/publish`, { method: "POST", body: {} }),

  programs: () => api.request(z.array(programSchema), "/admin/v1/loyalty-programs"),

  createProgram: ({ name, pointsPerPeriod }: CreateProgramInput) =>
    api.request(programSchema, "/admin/v1/loyalty-programs", {
      method: "POST",
      body: { ...createProgramInputSchema.parse({ name, pointsPerPeriod }), type: "onec", config: { pointsPerPeriod } },
    }),

  updateProgram: (programId: string, body: Record<string, unknown>) =>
    api.request(programSchema, `/admin/v1/loyalty-programs/${programId}`, { method: "PATCH", body }),

  deleteProgram: (programId: string) =>
    api.request(z.looseObject({}).or(z.null()), `/admin/v1/loyalty-programs/${programId}`, { method: "DELETE" }),

  tiers: (programId: string) => api.request(z.array(tierSchema), `/admin/v1/loyalty-programs/${programId}/tiers`),

  createTier: (programId: string, input: CreateTierInput) =>
    api.request(tierSchema, `/admin/v1/loyalty-programs/${programId}/tiers`, {
      method: "POST",
      body: createTierInputSchema.parse(input),
    }),

  deleteTier: (programId: string, tierId: string) =>
    api.request(z.looseObject({}).or(z.null()), `/admin/v1/loyalty-programs/${programId}/tiers/${tierId}`, {
      method: "DELETE",
    }),

  certificates: () => api.request(z.array(certificateSchema), "/admin/v1/certificates"),

  /** Проверяет, что ключ и сертификат сходятся между собой. */
  certificateHealth: (certificateId: string) =>
    api.request(certificateHealthSchema, `/admin/v1/certificates/${certificateId}/health`),

  setDefaultCertificate: (certificateId: string) =>
    api.request(certificateSchema, `/admin/v1/certificates/${certificateId}/set-default`, { method: "POST", body: {} }),

  platformSettings: () => api.request(platformSettingsSchema, "/admin/v1/platform-settings"),

  savePlatformSettings: (input: PlatformSettingsInput) =>
    api.request(platformSettingsSchema, "/admin/v1/platform-settings", {
      method: "PATCH",
      body: platformSettingsInputSchema.parse(input),
    }),

  auditLogs: () => api.request(z.array(auditLogSchema), "/admin/v1/audit-logs"),
});
