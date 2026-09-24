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

/** Пустое поле формы — «не указано»: сервер принимает null, но не пустую строку. */
const orNull = (value: string | undefined) =>
  value === undefined ? undefined : value.trim() === "" ? null : value.trim();

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
      body: (() => {
        const parsed = createMerchantInputSchema.parse(input);
        return { ...parsed, contactEmail: orNull(parsed.contactEmail), contactPhone: orNull(parsed.contactPhone) };
      })(),
    }),

  update: (merchantId: string, input: UpdateMerchantInput) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`, {
      method: "PATCH",
      body: (() => {
        const parsed = updateMerchantInputSchema.parse(input);
        return { ...parsed, contactEmail: orNull(parsed.contactEmail), contactPhone: orNull(parsed.contactPhone) };
      })(),
    }),

  /** Убирает заведение. Клиенты, карты и их баланс остаются — они принадлежат платформе. */
  remove: (merchantId: string) => api.request(z.unknown(), `/admin/v1/merchants/${merchantId}`, { method: "DELETE" }),

  suspend: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/suspend`, { method: "POST", body: {} }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  invites: (merchantId: string) =>
    api.request(z.array(merchantInviteSchema), `/admin/v1/merchants/${merchantId}/invites`),

  createInvite: (merchantId: string) =>
    api.request(merchantInviteSchema, `/admin/v1/merchants/${merchantId}/invites`, { method: "POST", body: {} }),
});
