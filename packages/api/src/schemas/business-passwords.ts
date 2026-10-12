import { z } from "zod";

/**
 * Переход бизнеса на вход по паролю (docs/API.md, «Пароли сотрудников магазинов: рассылка»):
 * агентство шлёт владельцам и администраторам филиалов временный пароль в WhatsApp.
 * none — пароля нет, temporary — временный из WhatsApp, set — свой.
 */
export const BUSINESS_PASSWORD_STATES = ["none", "temporary", "set"] as const;
export type BusinessPasswordState = (typeof BUSINESS_PASSWORD_STATES)[number];

export const BUSINESS_PASSWORD_LABELS: Record<BusinessPasswordState, string> = {
  none: "Пароля нет",
  temporary: "Временный отправлен",
  set: "Свой пароль",
};

export const businessPasswordRecipientSchema = z.looseObject({
  userId: z.string(),
  fullName: z.string().nullish(),
  phone: z.string(),
  password: z.enum(BUSINESS_PASSWORD_STATES),
  passwordIssuedAt: z.string().nullish(),
  passwordChangedAt: z.string().nullish(),
  merchants: z.array(z.looseObject({ merchantId: z.string(), merchantName: z.string(), role: z.string() })),
});
export type BusinessPasswordRecipient = z.infer<typeof businessPasswordRecipientSchema>;

export const businessPasswordListSchema = z.looseObject({
  items: z.array(businessPasswordRecipientSchema),
  summary: z.looseObject({
    total: z.number(),
    none: z.number(),
    temporary: z.number(),
    set: z.number(),
  }),
});
export type BusinessPasswordList = z.infer<typeof businessPasswordListSchema>;

export const businessPasswordSendResultSchema = z.looseObject({
  item: businessPasswordRecipientSchema,
  delivered: z.boolean(),
  skipped: z.boolean(),
});
export type BusinessPasswordSendResult = z.infer<typeof businessPasswordSendResultSchema>;
