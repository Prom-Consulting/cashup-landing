import { z } from "zod";

/**
 * Промокод на месяцы подписки или один клиентский цикл с заданным балансом. Многоразовый, но
 * каждый магазин или клиент применяет его один раз. Регистр не важен — сервер хранит
 * код заглавными.
 */
export const promoAudienceSchema = z.enum(["merchant", "client"]);
export type PromoAudience = z.infer<typeof promoAudienceSchema>;

export const PROMO_AUDIENCE_LABELS: Record<PromoAudience, string> = { merchant: "Магазинам", client: "Клиентам" };

export const promoKindSchema = z.enum(["months", "subscription_cycle"]);
export type PromoKind = z.infer<typeof promoKindSchema>;
export const PROMO_KIND_LABELS: Record<PromoKind, string> = {
  months: "Бесплатные месяцы",
  subscription_cycle: "Подписка на 30 дней",
};
export const promoClientEligibilitySchema = z.enum(["all", "without_subscription"]);
export type PromoClientEligibility = z.infer<typeof promoClientEligibilitySchema>;
export const PROMO_CLIENT_ELIGIBILITY_LABELS: Record<PromoClientEligibility, string> = {
  all: "Все клиенты",
  without_subscription: "Только без предыдущей подписки",
};

const promoBenefitFields = {
  kind: promoKindSchema.default("months"),
  cycleBalance: z.number().nullable().default(null),
};

export const promoCodeSchema = z.looseObject({
  id: z.string(),
  code: z.string(),
  audience: promoAudienceSchema,
  ...promoBenefitFields,
  clientEligibility: promoClientEligibilitySchema.nullish(),
  months: z.number(),
  maxUses: z.number().nullish(),
  uses: z.number(),
  expiresAt: z.string().nullish(),
  active: z.boolean(),
  note: z.string().nullish(),
  createdAt: z.string(),
  deletedAt: z.string().nullish(),
});
export type PromoCode = z.infer<typeof promoCodeSchema>;

export const promoRedemptionSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string().nullish(),
  merchantName: z.string().nullish(),
  userId: z.string().nullish(),
  userPhone: z.string().nullish(),
  months: z.number(),
  createdAt: z.string(),
  ...promoBenefitFields,
});
export type PromoRedemption = z.infer<typeof promoRedemptionSchema>;

/** Текст кода: 4–32 символа, латиница, цифры, дефис. Пусто при создании — сервер придумает сам. */
export const promoCodeTextSchema = z
  .string()
  .trim()
  .min(4, "Не короче 4 символов")
  .max(32, "Не длиннее 32 символов")
  .regex(/^[A-Za-z0-9-]+$/, "Только латинские буквы, цифры и дефис")
  .transform((code) => code.toUpperCase());

/** Значения формы создания: числа приходят строками, пустое — «не ограничено». */
export type CreatePromoForm = {
  code: string;
  audience: PromoAudience;
  kind: PromoKind;
  months: number | string;
  cycleBalance: number | string;
  clientEligibility: PromoClientEligibility;
  maxUses: number | string;
  expiresAt: string;
  note: string;
};

const createPromoCommonSchema = z.object({
  code: z.union([z.literal(""), promoCodeTextSchema]),
  maxUses: z.union([
    z.literal(""),
    z.coerce.number({ error: "Введите число" }).int("Целое число").min(1, "Хотя бы одно"),
  ]),
  expiresAt: z
    .string()
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), "Неверная дата")
    .refine((value) => value === "" || new Date(value) > new Date(), "Дата уже прошла"),
  note: z.string().trim().max(200, "Не длиннее 200 символов"),
});

export const createPromoFormSchema = z.discriminatedUnion("kind", [
  createPromoCommonSchema.extend({
    kind: z.literal("months"),
    audience: promoAudienceSchema,
    months: z.coerce.number({ error: "Введите число" }).int("Целое число").min(1, "Хотя бы месяц").max(36, "Не больше 36"),
    clientEligibility: promoClientEligibilitySchema,
  }),
  createPromoCommonSchema.extend({
    kind: z.literal("subscription_cycle"),
    audience: z.literal("client"),
    months: z.coerce.number().pipe(z.literal(1)),
    cycleBalance: z.coerce.number({ error: "Введите количество баллов" }).int("Введите целое число").min(1, "Введите положительное количество баллов"),
    clientEligibility: z.literal("without_subscription"),
  }),
]);

/** Тело POST: сервер строгий — лишнее поле или пустая строка дают 400. */
export function createPromoBody(values: CreatePromoForm) {
  const parsed = createPromoFormSchema.parse(values);
  return {
    ...(parsed.code === "" ? {} : { code: parsed.code }),
    audience: parsed.audience,
    kind: parsed.kind,
    months: parsed.months,
    ...(parsed.kind === "subscription_cycle" ? { cycleBalance: parsed.cycleBalance } : {}),
    ...(parsed.audience === "client" ? { clientEligibility: parsed.clientEligibility } : {}),
    maxUses: parsed.maxUses === "" ? null : parsed.maxUses,
    // Дата из поля — конец выбранного дня по местному времени
    expiresAt: parsed.expiresAt === "" ? null : new Date(`${parsed.expiresAt}T23:59:59`).toISOString(),
    note: parsed.note === "" ? null : parsed.note,
  };
}

export type UpdatePromoInput = {
  active?: boolean;
  maxUses?: number | null;
  expiresAt?: string | null;
  note?: string | null;
  clientEligibility?: PromoClientEligibility;
};

export const editPromoFormSchema = z.object({
  active: z.boolean(),
  clientEligibility: promoClientEligibilitySchema.default("all"),
  maxUses: z.union([z.literal(""), z.coerce.number().int("Целое число").min(1, "Хотя бы одно")]),
  expiresAt: z.string().refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)), "Неверная дата"),
  note: z.string().trim().max(200, "Не длиннее 200 символов"),
});

function localDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function editPromoInitialValues(promo: PromoCode) {
  return {
    active: promo.active,
    clientEligibility: promo.kind === "subscription_cycle" ? "without_subscription" as const : promo.clientEligibility ?? "all",
    maxUses: promo.maxUses == null ? "" : String(promo.maxUses),
    expiresAt: localDate(promo.expiresAt),
    note: promo.note ?? "",
  };
}

export function editPromoBody(values: ReturnType<typeof editPromoInitialValues>, promo: PromoCode): UpdatePromoInput {
  const schema = promo.kind === "subscription_cycle"
    ? editPromoFormSchema.extend({ clientEligibility: z.literal("without_subscription") })
    : editPromoFormSchema;
  const parsed = schema.parse(values);
  return {
    active: parsed.active,
    ...(promo.audience === "client" && parsed.clientEligibility !== editPromoInitialValues(promo).clientEligibility
      ? { clientEligibility: parsed.clientEligibility } : {}),
    maxUses: parsed.maxUses === "" ? null : parsed.maxUses,
    // Editing a note must not move an existing timestamp to the end of its day.
    ...(parsed.expiresAt === localDate(promo.expiresAt) ? {} : { expiresAt: parsed.expiresAt === "" ? null : new Date(`${parsed.expiresAt}T23:59:59.999`).toISOString() }),
    note: parsed.note === "" ? null : parsed.note,
  };
}

export const redeemPromoInputSchema = z.object({
  code: z.string().trim().min(1, "Введите промокод").pipe(promoCodeTextSchema),
});
export type RedeemPromoInput = { code: string };

/** Ответ применения: вид, баллы, срок и обновлённая подписка. Баланс карты перечитываем отдельно. */
export const promoRedeemResultSchema = z.looseObject({
  code: z.string(),
  audience: promoAudienceSchema,
  months: z.number(),
  ...promoBenefitFields,
  subscription: z.looseObject({}).nullish(),
});
export type PromoRedeemResult = z.infer<typeof promoRedeemResultSchema>;

export function promoSuccessText(result: PromoRedeemResult): string {
  if (result.kind === "subscription_cycle")
    return `Промокод ${result.code} принят: подписка на 30 дней${result.cycleBalance == null ? "" : `, ${new Intl.NumberFormat("ru-RU").format(result.cycleBalance)} баллов`}.`;
  const n = result.months;
  const word = n % 10 === 1 && n % 100 !== 11 ? "месяц"
    : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "месяца" : "месяцев";
  return `Промокод ${result.code} принят: +${n} ${word} подписки.`;
}
