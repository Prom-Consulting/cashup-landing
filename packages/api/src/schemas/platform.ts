import { z } from "zod";

/** Программа лояльности платформы. У Loal она одна, тип onec. */
export const programSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  programType: z.string(),
  config: z.record(z.string(), z.unknown()).nullish(),
  currency: z.string().nullish(),
  active: z.boolean().nullish(),
  bonusItemEnabled: z.boolean().nullish(),
  bonusItemName: z.string().nullish(),
  bonusItemMode: z.enum(["number", "text"]).nullish(),
  bonusItemOptions: z.array(z.string()).nullish(),
  bonusItemPartnerAccess: z.boolean().nullish(),
  /** Какие механики доступны партнёрам: ключ — механика, false — запрещена. */
  mechanicPartnerAccess: z.record(z.string(), z.boolean()).nullish(),
  createdAt: z.string().nullish(),
});
export type Program = z.infer<typeof programSchema>;

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  onec: "Подписка (баланс из 1С)",
  points: "Баллы",
  tiers: "Уровни",
  punchcard: "Штампы",
  fixed_discount: "Фиксированная скидка",
  membership: "Членство",
  points_punchcard: "Баллы и штампы",
  points_fixed_discount: "Баллы и скидка",
  fixed_discount_punchcard: "Скидка и штампы",
};

const pointsPerPeriod = z.coerce
  .number({ error: "Введите число" })
  .int("Целое число")
  .min(1, "Больше нуля")
  .max(10_000_000, "Слишком много для одного месяца");

export const createProgramInputSchema = z.object({
  name: z.string().trim().min(2, "Введите название").max(120, "Слишком длинное название"),
  /** Сколько баллов даёт подписка за месяц. */
  pointsPerPeriod,
});
export type CreateProgramInput = z.infer<typeof createProgramInputSchema>;

export const updateProgramInputSchema = createProgramInputSchema.extend({ active: z.boolean() });
export type UpdateProgramInput = z.infer<typeof updateProgramInputSchema>;

/** Механики, которые можно закрыть партнёрам программы. */
export const PROGRAM_MECHANICS = [
  { id: "points_earn", label: "Начислять баллы" },
  { id: "points_redeem", label: "Списывать баллы" },
  { id: "punch_earn", label: "Ставить штампы" },
  { id: "discount_redeem", label: "Давать скидку" },
] as const;

/**
 * Бонусный товар — наследие прежнего продукта: именованный подарок на карте.
 * При включённом нужны название и режим.
 */
export const bonusItemInputSchema = z
  .object({
    bonusItemEnabled: z.boolean(),
    bonusItemName: z.string().trim().max(60, "Не длиннее 60 символов"),
    bonusItemMode: z.enum(["number", "text"]).nullable(),
    /** Варианты для режима «текст», по одному на строку. */
    bonusItemOptions: z.string(),
    bonusItemPartnerAccess: z.boolean(),
  })
  .refine((value) => !value.bonusItemEnabled || value.bonusItemName.length > 0, {
    message: "Назовите бонусный товар",
    path: ["bonusItemName"],
  })
  .refine((value) => !value.bonusItemEnabled || value.bonusItemMode !== null, {
    message: "Выберите режим",
    path: ["bonusItemMode"],
  });
export type BonusItemInput = z.infer<typeof bonusItemInputSchema>;

/** Кто держит карту этой программы — строки приходят в snake_case, как из базы. */
export const programMemberSchema = z.looseObject({
  card_id: z.string(),
  serial_number: z.string(),
  customer_id: z.string().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  status: z.string(),
  points_balance: z.coerce.number().nullish(),
  punch_count: z.coerce.number().nullish(),
  tier_id: z.string().nullish(),
  created_at: z.string().nullish(),
});
export type ProgramMember = z.infer<typeof programMemberSchema>;

/**
 * Когда и где карта всплывает на экране блокировки. Единственный способ Apple
 * «напомнить о себе»: произвольный текст держателям Apple не отправить.
 */
export const appleRelevanceInputSchema = z.object({
  relevantDate: z.string().optional(),
  locations: z
    .array(
      z.object({
        latitude: z.coerce.number({ error: "Введите число" }).min(-90, "От −90 до 90").max(90, "От −90 до 90"),
        longitude: z.coerce.number({ error: "Введите число" }).min(-180, "От −180 до 180").max(180, "От −180 до 180"),
        relevantText: z.string().trim().max(60, "Не длиннее 60 символов").optional(),
      }),
    )
    .max(10, "Не больше 10 точек"),
});
export type AppleRelevanceInput = z.infer<typeof appleRelevanceInputSchema>;

/** Настоящее текстовое сообщение — только держателям в Google Wallet. */
export const googleMessageInputSchema = z.object({
  header: z.string().trim().min(1, "Введите заголовок").max(60, "Не длиннее 60 символов"),
  body: z.string().trim().min(1, "Введите текст").max(200, "Не длиннее 200 символов"),
});
export type GoogleMessageInput = z.infer<typeof googleMessageInputSchema>;

/** Уровень программы: порог считается по накопленной сумме покупок, не по балансу. */
export const tierSchema = z.looseObject({
  id: z.string(),
  loyaltyProgramId: z.string().nullish(),
  name: z.string(),
  threshold: z.number().nullish(),
  sortOrder: z.number().nullish(),
  earnPercent: z.number().nullish(),
  rewardType: z.enum(["fixed_discount_percent", "fixed_discount_amount"]).nullish(),
  rewardValue: z.number().nullish(),
  benefits: z.record(z.string(), z.unknown()).nullish(),
});
export type Tier = z.infer<typeof tierSchema>;

export const TIER_REWARD_LABELS = {
  fixed_discount_percent: "Скидка, %",
  fixed_discount_amount: "Скидка, сом",
} as const;

/** Пустое поле формы — «не задано»: на сервер уходит null, а не пустая строка. */
const optionalNumber = (schema: z.ZodNumber) =>
  z.union([z.literal(""), z.coerce.number({ error: "Введите число" }).pipe(schema)]);

export const tierInputSchema = z
  .object({
    name: z.string().trim().min(1, "Введите название").max(60, "Слишком длинное название"),
    /** Порог считается по накопленной сумме покупок, а не по остатку на карте. */
    threshold: z.coerce.number({ error: "Введите число" }).min(0, "Не меньше нуля").max(1_000_000_000, "Слишком много"),
    sortOrder: z.coerce.number({ error: "Введите число" }).int("Целое число").min(0, "Не меньше нуля"),
    earnPercent: optionalNumber(z.number().min(0, "Не меньше нуля").max(100, "Не больше 100%")),
    rewardType: z.union([z.literal(""), z.enum(["fixed_discount_percent", "fixed_discount_amount"])]),
    rewardValue: optionalNumber(z.number().positive("Больше нуля")),
  })
  .refine((value) => (value.rewardType === "") === (value.rewardValue === ""), {
    message: "Вид награды и её размер задаются вместе",
    path: ["rewardValue"],
  });
/** Значения формы уровня: числа приходят из полей строками, пустое — «не задано». */
export type TierInput = {
  name: string;
  threshold: number | string;
  sortOrder: number | string;
  earnPercent: number | string;
  rewardType: "" | "fixed_discount_percent" | "fixed_discount_amount";
  rewardValue: number | string;
};

export function tierFormValues(tier?: Tier): TierInput {
  return {
    name: tier?.name ?? "",
    threshold: tier?.threshold ?? 0,
    sortOrder: tier?.sortOrder ?? 0,
    earnPercent: tier?.earnPercent ?? "",
    rewardType: tier?.rewardType ?? "",
    rewardValue: tier?.rewardValue ?? "",
  };
}

/** Тело запроса уровня: пустые поля формы превращаются в null. */
export function tierBody(input: TierInput) {
  const parsed = tierInputSchema.parse(input);
  return {
    name: parsed.name,
    threshold: parsed.threshold,
    sortOrder: parsed.sortOrder,
    earnPercent: parsed.earnPercent === "" ? null : parsed.earnPercent,
    rewardType: parsed.rewardType === "" ? null : parsed.rewardType,
    rewardValue: parsed.rewardValue === "" ? null : parsed.rewardValue,
  };
}

/** Сертификат подписи карт. Платформенный: Loal подписывает всё своим Pass Type ID. */
export const certificateSchema = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  type: z.enum(["apple_pass", "google_service_account"]),
  /** pending_csr — запрос отправлен в Apple, ответный pass.cer ещё не загружен. */
  status: z.string().nullish(),
  teamId: z.string().nullish(),
  passTypeIdentifier: z.string().nullish(),
  googleIssuerId: z.string().nullish(),
  isDefault: z.boolean().nullish(),
  expiresAt: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Certificate = z.infer<typeof certificateSchema>;

export const CERTIFICATE_TYPE_LABELS: Record<Certificate["type"], string> = {
  apple_pass: "Apple Wallet",
  google_service_account: "Google Wallet",
};

export const certificateHealthSchema = z.looseObject({ ok: z.boolean(), error: z.string().nullish() });

/** Выпуск без Mac: сервер делает ключ и запрос, наружу уходит только запрос. */
export const csrInputSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120, "Слишком длинное название"),
  email: z.email("Похоже, в почте опечатка"),
});
export type CsrInput = z.infer<typeof csrInputSchema>;

export const csrResultSchema = z.looseObject({ certificate: certificateSchema, csrPem: z.string() });

export const csrPemSchema = z.looseObject({ csrPem: z.string() });

const nullableText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

/** Дата окончания из поля даты: пустое — null, иначе полночь по UTC. */
const nullableDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Неверная дата")
  .transform((value) => (value === "" ? null : new Date(value).toISOString()));

/** Запись о сертификате вручную — ключ потом загружается файлом. */
export const createCertificateInputSchema = z.object({
  type: z.enum(["apple_pass", "google_service_account"]),
  name: z.string().trim().min(1, "Введите название").max(120, "Слишком длинное название"),
  teamId: nullableText,
  passTypeIdentifier: nullableText,
  googleIssuerId: nullableText,
  expiresAt: nullableDate,
});
export type CreateCertificateInput = z.input<typeof createCertificateInputSchema>;

/** Правятся только описательные поля; сам ключ меняется новой загрузкой файла. */
export const updateCertificateInputSchema = createCertificateInputSchema.omit({ type: true });
export type UpdateCertificateInput = z.input<typeof updateCertificateInputSchema>;

/** Наследие прежнего продукта: подарки на карте. К подписке Loal отношения не имеют. */
export const bonusItemSchema = z.looseObject({
  id: z.string(),
  cardId: z.string().nullish(),
  customerId: z.string().nullish(),
  customerName: z.string().nullish(),
  value: z.string(),
  grantedAt: z.string(),
  redeemedAt: z.string().nullish(),
});
export type BonusItem = z.infer<typeof bonusItemSchema>;

export const bonusItemPageSchema = z.looseObject({
  items: z.array(bonusItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

/** Текст «о компании», который дописывается на оборот каждой выпущенной карты. */
export const platformSettingsSchema = z.looseObject({ infoText: z.string().nullish(), infoUrl: z.string().nullish() });
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

/** Выдать карты сразу нескольким клиентам — по выбранной карте и программе. */
export const bulkIssueInputSchema = z.object({
  customerIds: z.array(z.string()).min(1, "Выберите хотя бы одного клиента").max(500, "Не больше 500 за раз"),
  templateId: z.string().min(1, "Выберите карту"),
  programId: z.string().min(1, "Выберите программу"),
});
export type BulkIssueInput = z.infer<typeof bulkIssueInputSchema>;
