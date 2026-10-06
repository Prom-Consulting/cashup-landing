import { z } from "zod";

/**
 * Промокод на бесплатные месяцы подписки: магазинам или клиентам. Многоразовый, но
 * каждый магазин или клиент применяет его один раз. Регистр не важен — сервер хранит
 * код заглавными.
 */
export const promoAudienceSchema = z.enum(["merchant", "client"]);
export type PromoAudience = z.infer<typeof promoAudienceSchema>;

export const PROMO_AUDIENCE_LABELS: Record<PromoAudience, string> = { merchant: "Магазинам", client: "Клиентам" };

export const promoCodeSchema = z.looseObject({
  id: z.string(),
  code: z.string(),
  audience: promoAudienceSchema,
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
  months: number | string;
  maxUses: number | string;
  expiresAt: string;
  note: string;
};

export const createPromoFormSchema = z.object({
  code: z.union([z.literal(""), promoCodeTextSchema]),
  audience: promoAudienceSchema,
  months: z.coerce
    .number({ error: "Введите число" })
    .int("Целое число")
    .min(1, "Хотя бы месяц")
    .max(36, "Не больше 36"),
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

/** Тело POST: сервер строгий — лишнее поле или пустая строка дают 400. */
export function createPromoBody(values: CreatePromoForm) {
  const parsed = createPromoFormSchema.parse(values);
  return {
    ...(parsed.code === "" ? {} : { code: parsed.code }),
    audience: parsed.audience,
    months: parsed.months,
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
};

export const editPromoFormSchema = z.object({
  active: z.boolean(),
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
  return { active: promo.active, maxUses: promo.maxUses == null ? "" : String(promo.maxUses), expiresAt: localDate(promo.expiresAt), note: promo.note ?? "" };
}

export function editPromoBody(values: ReturnType<typeof editPromoInitialValues>, promo: PromoCode): UpdatePromoInput {
  const parsed = editPromoFormSchema.parse(values);
  return {
    active: parsed.active,
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

/** Ответ применения: код, сколько месяцев и подписка уже с ними. */
export const promoRedeemResultSchema = z.looseObject({
  code: z.string(),
  audience: promoAudienceSchema,
  months: z.number(),
  subscription: z.looseObject({}).nullish(),
});
export type PromoRedeemResult = z.infer<typeof promoRedeemResultSchema>;
