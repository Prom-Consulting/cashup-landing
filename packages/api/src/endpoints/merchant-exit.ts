import { z } from "zod";
import type { ApiClient } from "../http";
import {
  exitRequestInputSchema,
  exitRequestSchema,
  rejectExitInputSchema,
  type ExitRequestInput,
  type ExitRequestStatus,
  type RejectExitInput,
} from "../schemas/merchant-exit";

/**
 * Выход партнёра: владелец подаёт заявку (кассиру и администратору филиала — 403), агентство
 * решает. Открытая заявка одна — повторный POST вернёт её же. 404 EXIT_REQUEST_NOT_FOUND,
 * 409 EXIT_REQUEST_DECIDED — заявку уже решили иначе.
 */
export const merchantExitApi = (api: ApiClient) => ({
  /** Последняя заявка магазина или null — заявок не было. */
  current: (merchantId: string) =>
    api.request(exitRequestSchema.nullable(), `/admin/v1/merchants/${merchantId}/exit-request`),

  request: (merchantId: string, input: ExitRequestInput) => {
    const { reason, octopay } = exitRequestInputSchema.parse(input);
    return api.request(exitRequestSchema, `/admin/v1/merchants/${merchantId}/exit-request`, {
      method: "POST",
      body: { ...(reason ? { reason } : {}), octopay },
    });
  },

  /** Агентство: без status — все заявки. */
  list: (status?: ExitRequestStatus) =>
    api.request(z.array(exitRequestSchema), "/admin/v1/merchant-exit-requests", { query: { status } }),

  /** Удаляет магазин; повтор доводит прерванное удаление и заново шлёт WhatsApp, если не дошёл. */
  approve: (id: string) =>
    api.request(exitRequestSchema, `/admin/v1/merchant-exit-requests/${id}/approve`, { method: "POST", body: {} }),

  reject: (id: string, input: RejectExitInput) =>
    api.request(exitRequestSchema, `/admin/v1/merchant-exit-requests/${id}/reject`, {
      method: "POST",
      body: rejectExitInputSchema.parse(input),
    }),
});
