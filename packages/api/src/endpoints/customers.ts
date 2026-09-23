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
 * Клиенты магазина и выпуск карт. Выпускать карты может только магазин с ролью
 * issuer (в Cashup это сам Loal) — остальным бэкенд ответит 400.
 */
export const customersApi = (api: ApiClient) => ({
  table: (storeId: string, query: CustomerQuery = {}) =>
    api.request(customerPageSchema, `/admin/v1/stores/${storeId}/customers/table`, { query }),

  create: (storeId: string, input: CreateCustomerInput) =>
    api.request(customerSchema, `/admin/v1/stores/${storeId}/customers`, {
      method: "POST",
      body: createCustomerInputSchema.parse(input),
    }),

  /** Архивация необратима: карты клиента отзываются тем же запросом. */
  archive: (storeId: string, customerId: string) =>
    api.request(customerSchema, `/admin/v1/stores/${storeId}/customers/${customerId}/archive`, {
      method: "POST",
      body: {},
    }),

  cards: (storeId: string, customerId: string) =>
    api.request(z.array(cardSchema), `/admin/v1/stores/${storeId}/customers/${customerId}/cards`),

  issueCard: (storeId: string, input: IssueCardInput) =>
    api.request(cardSchema, `/admin/v1/stores/${storeId}/cards`, {
      method: "POST",
      body: issueCardInputSchema.parse(input),
    }),

  revokeCard: (storeId: string, serial: string) =>
    api.request(cardSchema, `/admin/v1/stores/${storeId}/cards/${encodeURIComponent(serial)}/revoke`, {
      method: "POST",
      body: {},
    }),

  templates: (storeId: string) => api.request(z.array(passTemplateSchema), `/admin/v1/stores/${storeId}/templates`),

  programs: (storeId: string) =>
    api.request(z.array(loyaltyProgramSchema), `/admin/v1/stores/${storeId}/loyalty-programs`),
});
