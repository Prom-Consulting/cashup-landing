import { z } from "zod";
import type { ApiClient } from "../http";
import {
  cashierOverviewSchema,
  cashierRedemptionPageSchema,
  cashierSchema,
  createCashierInputSchema,
  type CashierRedemptionQuery,
  type CreateCashierInput,
} from "../schemas/cashier";

/** Кабинет кассира филиала: человек из токена, идентификатора в адресе нет. */
export const cashierApi = (api: ApiClient) => ({
  overview: () => api.request(cashierOverviewSchema, "/v1/cashier/overview"),

  /** Только свои списания; списывают тем же POST /v1/redemptions, что и касса. */
  redemptions: (query: CashierRedemptionQuery = {}) =>
    api.request(cashierRedemptionPageSchema, "/v1/cashier/redemptions", { query }),
});

/**
 * Кассиры партнёра. Ключ — запись самого партнёра (memberId); филиал сервер назначает сам.
 * После удаления сессия кассира гаснет сразу.
 */
export const partnerCashiersApi = (api: ApiClient) => ({
  list: (partnerMemberId: string) =>
    api.request(z.array(cashierSchema), `/admin/v1/members/${partnerMemberId}/cashiers`),

  create: (partnerMemberId: string, input: CreateCashierInput) =>
    api.request(cashierSchema, `/admin/v1/members/${partnerMemberId}/cashiers`, {
      method: "POST",
      body: createCashierInputSchema.parse(input),
    }),

  remove: (partnerMemberId: string, cashierMemberId: string) =>
    api.request(z.looseObject({ deleted: z.boolean().nullish() }), `/admin/v1/members/${partnerMemberId}/cashiers/${cashierMemberId}`, {
      method: "DELETE",
    }),
});
