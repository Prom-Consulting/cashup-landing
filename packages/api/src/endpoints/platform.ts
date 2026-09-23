import { z } from "zod";
import type { ApiClient } from "../http";
import { cardSchema } from "../schemas/card";
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

  templates: () => api.request(z.array(passTemplateSchema), "/admin/v1/templates"),

  programs: () => api.request(z.array(loyaltyProgramSchema), "/admin/v1/loyalty-programs"),
});
