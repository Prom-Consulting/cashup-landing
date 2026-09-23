import { z } from "zod";
import type { ApiClient } from "../http";
import { createLeadInputSchema, leadSchema, type CreateLeadInput, type LeadStatus } from "../schemas/lead";

/** Заявки с лендинга: приём — публичный, разбор — в админке. */
export const leadsApi = (api: ApiClient) => ({
  list: () => api.request(z.array(leadSchema), "/admin/v1/leads"),

  updateStatus: (id: string, status: LeadStatus) =>
    api.request(leadSchema, `/admin/v1/leads/${id}/status`, { method: "PUT", body: { status } }),

  create: (input: CreateLeadInput) =>
    api.request(leadSchema, "/v1/public/leads", {
      method: "POST",
      body: createLeadInputSchema.parse(input),
      anonymous: true,
    }),
});
