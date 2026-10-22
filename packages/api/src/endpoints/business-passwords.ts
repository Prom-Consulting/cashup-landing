import type { ApiClient } from "../http";
import { businessPasswordListSchema, businessPasswordSendResultSchema } from "../schemas/business-passwords";

/**
 * Временные пароли бизнеса — только агентству. send шлёт новый пароль в WhatsApp по одному человеку:
 * кабинет сам проходит список. У кого пароль свой — skipped, пока не попросить replaceOwn.
 * 502 WHATSAPP_FAILED — не доставлено, пароль прежний; 404 RECIPIENT_NOT_FOUND — человека нет в списке.
 */
export const businessPasswordsApi = (api: ApiClient) => ({
  list: () => api.request(businessPasswordListSchema, "/admin/v1/business-passwords"),

  send: (userId: string, replaceOwn = false) =>
    api.request(businessPasswordSendResultSchema, `/admin/v1/business-passwords/${userId}/send`, {
      method: "POST",
      body: replaceOwn ? { replaceOwn: true } : {},
    }),
});
