import { z } from "zod";
import type { ApiClient } from "../http";
import {
  createStoreInputSchema,
  storeInviteSchema,
  storeMemberSchema,
  storeSchema,
  updateStoreInputSchema,
  type CreateStoreInput,
  type StoreKind,
  type UpdateStoreInput,
} from "../schemas/store";

/**
 * Магазины. Доступ к /admin/v1/stores/{id}/... есть у сотрудников этого магазина
 * и у super_admin; создание, приостановка и удаление — только у платформы.
 */
export const storesApi = (api: ApiClient) => ({
  list: (kind?: StoreKind) => api.request(z.array(storeSchema), "/admin/v1/stores", { query: { kind } }),

  get: (storeId: string) => api.request(storeSchema, `/admin/v1/stores/${storeId}`),

  create: (input: CreateStoreInput) =>
    api.request(storeSchema, "/admin/v1/stores", { method: "POST", body: createStoreInputSchema.parse(input) }),

  update: (storeId: string, input: UpdateStoreInput) =>
    api.request(storeSchema, `/admin/v1/stores/${storeId}`, {
      method: "PATCH",
      body: updateStoreInputSchema.parse(input),
    }),

  suspend: (storeId: string) =>
    api.request(storeSchema, `/admin/v1/stores/${storeId}/suspend`, { method: "POST", body: {} }),

  members: (storeId: string) => api.request(z.array(storeMemberSchema), `/admin/v1/stores/${storeId}/members`),

  invites: (storeId: string) => api.request(z.array(storeInviteSchema), `/admin/v1/stores/${storeId}/invites`),

  /** Код приглашения владельца магазина. Выдаёт только платформа. */
  createInvite: (storeId: string) =>
    api.request(storeInviteSchema, `/admin/v1/stores/${storeId}/invites`, { method: "POST", body: {} }),
});
