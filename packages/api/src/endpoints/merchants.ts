import { z } from "zod";
import type { ApiClient } from "../http";
import {
  createMerchantInputSchema,
  merchantInviteSchema,
  merchantMemberSchema,
  merchantSchema,
  updateMerchantInputSchema,
  type CreateMerchantInput,
  type UpdateMerchantInput,
} from "../schemas/merchant";

/**
 * Заведения. Список и создание — только у агентства; карточку заведения видит и оно
 * само. Клиенты, карты и шаблоны сюда больше не входят: они принадлежат платформе.
 */
export const merchantsApi = (api: ApiClient) => ({
  list: () => api.request(z.array(merchantSchema), "/admin/v1/merchants"),

  get: (merchantId: string) => api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`),

  create: (input: CreateMerchantInput) =>
    api.request(merchantSchema, "/admin/v1/merchants", {
      method: "POST",
      body: createMerchantInputSchema.parse(input),
    }),

  update: (merchantId: string, input: UpdateMerchantInput) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`, {
      method: "PATCH",
      body: updateMerchantInputSchema.parse(input),
    }),

  suspend: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/suspend`, { method: "POST", body: {} }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  invites: (merchantId: string) =>
    api.request(z.array(merchantInviteSchema), `/admin/v1/merchants/${merchantId}/invites`),

  createInvite: (merchantId: string) =>
    api.request(merchantInviteSchema, `/admin/v1/merchants/${merchantId}/invites`, { method: "POST", body: {} }),
});
