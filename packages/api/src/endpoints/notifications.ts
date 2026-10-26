import type { ApiClient } from "../http";
import { notificationsInboxSchema } from "../schemas/notifications";

/** Центр уведомлений заведения. Доступ — владелец и администратор филиала. */
export const notificationsApi = (api: ApiClient) => ({
  inbox: (merchantId: string) =>
    api.request(notificationsInboxSchema, `/admin/v1/merchants/${merchantId}/notifications`),

  markRead: (merchantId: string, ids?: string[]) =>
    api.request(notificationsInboxSchema, `/admin/v1/merchants/${merchantId}/notifications/read`, {
      method: "POST",
      body: ids && ids.length ? { ids } : {},
    }),
});
