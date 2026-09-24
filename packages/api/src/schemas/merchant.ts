import { z } from "zod";

/**
 * Мерчант — заведение, принимающее бонусы. Раньше назывался store; карты, клиенты
 * и программа ему больше не принадлежат: они платформенные (см. docs/API.md).
 */
export const merchantStatusSchema = z.enum(["active", "suspended", "trial"]);
export type MerchantStatus = z.infer<typeof merchantStatusSchema>;

export const MERCHANT_STATUS_LABELS: Record<MerchantStatus, string> = {
  active: "Работает",
  suspended: "Приостановлен",
  trial: "Пробный",
};

/** Этап подключения заведения — от оплаты до запуска. */
export const merchantWorkflowStatusSchema = z.enum(["paid", "brief", "design", "approval", "build", "done"]);
export type MerchantWorkflowStatus = z.infer<typeof merchantWorkflowStatusSchema>;

export const WORKFLOW_STATUS_ORDER: MerchantWorkflowStatus[] = ["paid", "brief", "design", "approval", "build", "done"];

export const WORKFLOW_STATUS_LABELS: Record<MerchantWorkflowStatus, string> = {
  paid: "Оплачено",
  brief: "Бриф",
  design: "Дизайн",
  approval: "Согласование",
  build: "Сертификаты и сборка",
  done: "Готово",
};

export const merchantSchema = z.looseObject({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  status: merchantStatusSchema,
  workflowStatus: merchantWorkflowStatusSchema,
  contactEmail: z.string().nullish(),
  contactPhone: z.string().nullish(),
  logoUrl: z.string().nullish(),
  createdAt: z.string(),
});
export type Merchant = z.infer<typeof merchantSchema>;

export const merchantMemberSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "staff", "partner", "partner_employee"]),
  permissions: z.record(z.string(), z.boolean()).default({}),
  branchId: z.string().nullish(),
  invitedAt: z.string().nullish(),
  acceptedAt: z.string().nullish(),
  /** У сотрудника партнёра — запись партнёра, который его завёл. */
  parentMemberId: z.string().nullish(),
  /** Приветственный бонус партнёра; null — не настроен, а не «ноль». */
  partnerBonusAmount: z.number().nullish(),
  /** Сколько раз одному клиенту; null — без ограничения. */
  partnerBonusMaxPerCustomer: z.number().nullish(),
  defaultTemplateId: z.string().nullish(),
  defaultProgramId: z.string().nullish(),
});
export type MerchantMember = z.infer<typeof merchantMemberSchema>;

export const merchantInviteSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string().nullish(),
  code: z.string(),
  role: z.string().nullish(),
  createdAt: z.string().nullish(),
  /** Код одноразовый: после регистрации здесь дата и кто им воспользовался. */
  usedAt: z.string().nullish(),
  usedByUserId: z.string().nullish(),
});
export type MerchantInvite = z.infer<typeof merchantInviteSchema>;

/** Заводит заведение агентство: slug попадает в адреса, поэтому только латиница. */
export const createMerchantInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Минимум 2 символа")
    .regex(/^[a-z0-9-]+$/, "Латиница, цифры и дефис"),
  name: z.string().trim().min(2, "Введите название").max(120, "Слишком длинное название"),
  contactEmail: z.union([z.literal(""), z.email("Похоже, в почте опечатка")]).optional(),
  contactPhone: z
    .string()
    .trim()
    .refine((value) => value === "" || value.replace(/\D/g, "").length >= 9, "Проверьте номер телефона")
    .optional(),
});
export type CreateMerchantInput = z.infer<typeof createMerchantInputSchema>;

export const updateMerchantInputSchema = z.object({
  name: z.string().trim().min(2, "Введите название").optional(),
  contactEmail: z.union([z.literal(""), z.email("Похоже, в почте опечатка")]).optional(),
  contactPhone: z.string().trim().optional(),
  workflowStatus: merchantWorkflowStatusSchema.optional(),
});
export type UpdateMerchantInput = z.infer<typeof updateMerchantInputSchema>;

/**
 * Витрина заведения: то, что клиент видит в каталоге. PUT заменяет профиль целиком —
 * все шесть полей обязательны, пустое поле шлётся как null, фотографии как [].
 */
export const merchantProfileSchema = z.object({
  category: z.string().trim().min(1).max(60).nullable(),
  description: z.string().trim().min(1).max(2000).nullable(),
  logoUrl: z.string().nullable(),
  photos: z.array(z.string()).max(10),
  instagramUrl: z.string().nullable(),
  twogisUrl: z.string().nullable(),
});
export type MerchantProfile = z.infer<typeof merchantProfileSchema>;

/** Пустая строка допустима: это «поле не заполнено», при отправке станет null. */
const optionalUrl = z
  .string()
  .trim()
  .max(500, "Слишком длинный адрес")
  .refine((value) => value === "" || /^https?:\/\/\S+\.\S+/i.test(value), "Похоже на неполный адрес: нужен https://…");

/** То, что заполняет сам магазин в кабинете: пустые строки превращаем в null при отправке. */
export const merchantProfileFormSchema = z.object({
  category: z.string().trim().max(60, "Не длиннее 60 символов"),
  description: z.string().trim().max(2000, "Не длиннее 2000 символов"),
  instagramUrl: optionalUrl.refine(
    (value) => value === "" || /instagram\.com/i.test(value),
    "Это не похоже на ссылку в Instagram",
  ),
  twogisUrl: optionalUrl.refine((value) => value === "" || /2gis\./i.test(value), "Это не похоже на ссылку в 2ГИС"),
});
export type MerchantProfileForm = z.infer<typeof merchantProfileFormSchema>;

export const uploadedAssetSchema = z.looseObject({ url: z.string() });

/** Публичная витрина для каталога на сайте. */
export const publicPartnerSchema = merchantProfileSchema.extend({
  id: z.string(),
  name: z.string(),
  contactPhone: z.string().nullable(),
  /** Потолок процента — «до N%» на карточке; null — магазин его не задал. */
  maxCoveragePercent: z.number().nullish(),
});
export type PublicPartner = z.infer<typeof publicPartnerSchema>;

/**
 * Потолок процента: сколько процентов цены одной позиции магазин готов покрыть
 * баллами. Магазин меняет его не чаще раза в месяц — до nextChangeAt сервер ответит 409.
 */
export const coverageLimitSchema = z.looseObject({
  maxCoveragePercent: z.number().nullable(),
  /** Когда потолок менял сам магазин; правка агентства эту дату не трогает. */
  changedAt: z.string().nullish(),
  /** Когда магазин сможет поменять снова; null — прямо сейчас. */
  nextChangeAt: z.string().nullish(),
});
export type CoverageLimit = z.infer<typeof coverageLimitSchema>;

/** Пустое поле — «потолок не задан»: в приложении действует общий предел 30%, в 1С — 100%. */
export const coverageLimitInputSchema = z.object({
  maxCoveragePercent: z.union([
    z.literal(""),
    z.coerce
      .number({ error: "Введите число" })
      .int("Целое число процентов")
      .min(1, "Не меньше 1%")
      .max(100, "Не больше 100%"),
  ]),
});
export type CoverageLimitInput = z.infer<typeof coverageLimitInputSchema>;

/** Предел приложения-кассы, общий для всех магазинов (docs/API.md). */
export const SCANNER_MAX_COVERAGE_PERCENT = 30;
