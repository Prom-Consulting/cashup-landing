import { z } from "zod";
import type { ApiClient } from "../http";
import { storeInviteSchema, storeMemberSchema, storeSchema } from "../schemas/store";

/** Магазины и их сотрудники. Доступно платформе (super_admin) и владельцу магазина. */
export const storesApi = (api: ApiClient) => ({
  list: () => api.request(z.array(storeSchema), "/admin/v1/stores"),

  get: (storeId: string) => api.request(storeSchema, `/admin/v1/stores/${storeId}`),

  members: (storeId: string) => api.request(z.array(storeMemberSchema), `/admin/v1/stores/${storeId}/members`),

  invites: (storeId: string) => api.request(z.array(storeInviteSchema), `/admin/v1/stores/${storeId}/invites`),

  /** Код приглашения владельца магазина. Выдаёт только платформа. */
  createInvite: (storeId: string) =>
    api.request(storeInviteSchema, `/admin/v1/stores/${storeId}/invites`, { method: "POST", body: {} }),
});
