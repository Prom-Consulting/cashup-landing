import { z } from "zod";

/** Программа лояльности платформы. У Cashup она одна, тип onec. */
export const programSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  type: z.string().nullish(),
  config: z.record(z.string(), z.unknown()).nullish(),
  createdAt: z.string().nullish(),
});
export type Program = z.infer<typeof programSchema>;

export const createProgramInputSchema = z.object({
  name: z.string().trim().min(2, "Введите название").max(120, "Слишком длинное название"),
  /** Сколько баллов даёт подписка за месяц. */
  pointsPerPeriod: z.coerce
    .number({ error: "Введите число" })
    .int("Целое число")
    .min(1, "Больше нуля")
    .max(10_000_000, "Слишком много для одного месяца"),
});
export type CreateProgramInput = z.infer<typeof createProgramInputSchema>;

/** Уровень программы: порог считается по накопленной сумме покупок, не по балансу. */
export const tierSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  threshold: z.number().nullish(),
  sortOrder: z.number().nullish(),
  earnPercent: z.number().nullish(),
  rewardType: z.string().nullish(),
  rewardValue: z.number().nullish(),
});
export type Tier = z.infer<typeof tierSchema>;

export const createTierInputSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(60, "Слишком длинное название"),
  /** Порог считается по накопленной сумме покупок, а не по остатку на карте. */
  threshold: z.coerce.number({ error: "Введите число" }).min(0, "Не меньше нуля").max(1_000_000_000, "Слишком много"),
  sortOrder: z.coerce.number().int().min(0).default(0),
  earnPercent: z
    .union([z.literal(""), z.coerce.number().min(0, "Не меньше нуля").max(100, "Не больше 100%")])
    .optional(),
});
export type CreateTierInput = z.infer<typeof createTierInputSchema>;

/** Шаблон карты. Выпуск по неопубликованному шаблону бэкенд отклоняет. */
export const templateSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  cardType: z.string().nullish(),
  status: z.string().nullish(),
  programId: z.string().nullish(),
  version: z.number().nullish(),
  isShowcase: z.boolean().nullish(),
});
export type Template = z.infer<typeof templateSchema>;

/** Сертификат подписи карт. Платформенный: Cashup подписывает всё своим Pass Type ID. */
export const certificateSchema = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  type: z.string().nullish(),
  status: z.string().nullish(),
  teamId: z.string().nullish(),
  passTypeIdentifier: z.string().nullish(),
  isDefault: z.boolean().nullish(),
  expiresAt: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Certificate = z.infer<typeof certificateSchema>;

export const certificateHealthSchema = z.looseObject({
  ok: z.boolean().nullish(),
  message: z.string().nullish(),
  expiresAt: z.string().nullish(),
});

/** Текст «о компании», который дописывается на оборот каждой выпущенной карты. */
export const platformSettingsSchema = z.looseObject({
  infoText: z.string().nullish(),
  infoUrl: z.string().nullish(),
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const platformSettingsInputSchema = z.object({
  infoText: z.string().trim().max(2000, "Не длиннее 2000 символов"),
  infoUrl: z
    .string()
    .trim()
    .refine((value) => value === "" || /^https?:\/\//i.test(value), "Адрес должен начинаться с http:// или https://"),
});
export type PlatformSettingsInput = z.infer<typeof platformSettingsInputSchema>;

export const auditLogSchema = z.looseObject({
  id: z.string(),
  action: z.string().nullish(),
  entity: z.string().nullish(),
  entityId: z.string().nullish(),
  userId: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

/** Карту заводят по телефону либо по существующему клиенту — вместе нельзя. */
export const issueCardByPhoneInputSchema = z.object({
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 9, "Введите номер телефона"),
  firstName: z.string().trim().min(2, "Введите имя").max(60, "Слишком длинное имя"),
  lastName: z.string().trim().max(60, "Слишком длинная фамилия").optional(),
});
export type IssueCardByPhoneInput = z.infer<typeof issueCardByPhoneInputSchema>;
