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
  /** includeDeleted — вместе с архивом удалённых магазинов. */
  list: (options: { includeDeleted?: boolean } = {}) =>
    api.request(z.array(merchantSchema), `/admin/v1/merchants${options.includeDeleted ? "?includeDeleted=true" : ""}`),

  get: (merchantId: string) => api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`),

  create: (input: CreateMerchantInput) =>
    api.request(merchantSchema, "/admin/v1/merchants", {
      method: "POST",
      body: (() => {
        const parsed = createMerchantInputSchema.parse(input);
        return { ...parsed, contactEmail: orNull(parsed.contactEmail) };
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

  /**
   * В архив: магазин, филиалы и все членства закрываются, сессии сотрудников гаснут. Аккаунты,
   * карты, подписки и балансы клиентов остаются. Восстановления нет. Повтор — та же дата.
   */
  remove: (merchantId: string) =>
    api.request(
      z.looseObject({ id: z.string(), slug: z.string().nullish(), deletedAt: z.string().nullish() }).or(z.null()),
      `/admin/v1/merchants/${merchantId}`,
      { method: "DELETE" },
    ),

  suspend: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/suspend`, { method: "POST", body: {} }),

  /** Обратно в работу после приостановки. Только агентство. */
  activate: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/activate`, { method: "POST", body: {} }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  invites: (merchantId: string) =>
    api.request(z.array(merchantInviteSchema), `/admin/v1/merchants/${merchantId}/invites`),

  createInvite: (merchantId: string) =>
    api.request(merchantInviteSchema, `/admin/v1/merchants/${merchantId}/invites`, { method: "POST", body: {} }),
});
