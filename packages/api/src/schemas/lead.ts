import { z } from "zod";

/** Заявка с лендинга: человек оставил телефон, агентство перезванивает. */
export const leadStatusSchema = z.enum(["new", "contacted", "closed"]);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  contacted: "Связались",
  closed: "Закрыта",
};

export const leadSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  company: z.string().nullish(),
  cardType: z.string().nullish(),
  comment: z.string().nullish(),
  status: leadStatusSchema,
  createdAt: z.string(),
});
export type Lead = z.infer<typeof leadSchema>;

/** То, что отправляет форма лендинга в POST /v1/public/leads. */
export const createLeadInputSchema = z.object({
  name: z.string().trim().min(1, "Как к вам обращаться?"),
  phone: z.string().trim().min(6, "Введите номер телефона"),
  company: z.string().trim().optional(),
  cardType: z.string().trim().optional(),
  comment: z.string().trim().max(1000, "Слишком длинный текст").optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
