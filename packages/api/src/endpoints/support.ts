import { z } from "zod";
import type { ApiClient } from "../http";
import {
  agencySupportListSchema,
  supportReplyInputSchema,
  supportThreadSchema,
  supportTicketInputSchema,
  supportTicketSchema,
  type SupportReplyInput,
  type SupportStatus,
  type SupportTicketInput,
} from "../schemas/support";

/**
 * Вопросы магазина агентству. Магазин — владелец (все ветки) и администратор филиала (только свои),
 * кассиру 403. Чужая ветка — 404 SUPPORT_TICKET_NOT_FOUND. Открыть ветку = отметить ответы прочитанными.
 */
export const supportApi = (api: ApiClient) => ({
  list: (merchantId: string) =>
    api.request(z.array(supportTicketSchema), `/admin/v1/merchants/${merchantId}/support-tickets`),

  create: (merchantId: string, input: SupportTicketInput) =>
    api.request(supportTicketSchema, `/admin/v1/merchants/${merchantId}/support-tickets`, {
      method: "POST",
      body: supportTicketInputSchema.parse(input),
    }),

  thread: (merchantId: string, ticketId: string) =>
    api.request(supportThreadSchema, `/admin/v1/merchants/${merchantId}/support-tickets/${ticketId}`),

  reply: (merchantId: string, ticketId: string, input: SupportReplyInput) =>
    api.request(supportThreadSchema, `/admin/v1/merchants/${merchantId}/support-tickets/${ticketId}/messages`, {
      method: "POST",
      body: supportReplyInputSchema.parse(input),
    }),

  close: (merchantId: string, ticketId: string) =>
    api.request(supportThreadSchema, `/admin/v1/merchants/${merchantId}/support-tickets/${ticketId}/close`, {
      method: "POST",
      body: {},
    }),
});

/** Агентство: входящие вопросы всех магазинов. Ответ уходит автору ещё и в WhatsApp (notified). */
export const agencySupportApi = (api: ApiClient) => ({
  list: (status?: SupportStatus) =>
    api.request(agencySupportListSchema, "/admin/v1/support-tickets", { query: { status } }),

  thread: (ticketId: string) => api.request(supportThreadSchema, `/admin/v1/support-tickets/${ticketId}`),

  reply: (ticketId: string, input: SupportReplyInput) =>
    api.request(supportThreadSchema, `/admin/v1/support-tickets/${ticketId}/messages`, {
      method: "POST",
      body: supportReplyInputSchema.parse(input),
    }),

  close: (ticketId: string) =>
    api.request(supportThreadSchema, `/admin/v1/support-tickets/${ticketId}/close`, { method: "POST", body: {} }),
});
