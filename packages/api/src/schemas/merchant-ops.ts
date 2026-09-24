import { z } from "zod";

/** Филиал — физическая точка заведения; к нему привязывают сотрудника. */
export const branchSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  name: z.string(),
  createdAt: z.string().nullish(),
});
export type Branch = z.infer<typeof branchSchema>;

export const createBranchInputSchema = z.object({
  name: z.string().trim().min(2, "Введите название точки").max(80, "Слишком длинное название"),
});
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;

/** Сотрудника подключают по уже существующему userId: он сначала регистрируется сам. */
const userIdSchema = z
  .string()
  .trim()
  .min(1, "Укажите пользователя")
  .refine(
    (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    "Это должен быть идентификатор пользователя, а не имя или телефон",
  );

export const addMemberInputSchema = z.object({
  userId: userIdSchema,
  role: z.enum(["admin", "staff"]),
  branchId: z.string().trim().optional(),
});
export type AddMemberInput = z.infer<typeof addMemberInputSchema>;

/** Партнёру выбирают одну операцию на всю жизнь: начислять или списывать. */
export const addPartnerInputSchema = z.object({
  userId: userIdSchema,
  scanOperation: z.enum(["earn", "redeem"]),
  branchId: z.string().trim().optional(),
});
export type AddPartnerInput = z.infer<typeof addPartnerInputSchema>;

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  admin: "Владелец",
  staff: "Сотрудник",
  partner: "Партнёр",
  partner_employee: "Сотрудник партнёра",
};

/** Что кассир вводит при начислении и списании. Одна строка на программу. */
export const posSettingsSchema = z.looseObject({
  merchantId: z.string().nullish(),
  programId: z.string(),
  earnInputMode: z.string().nullish(),
  redeemInputMode: z.string().nullish(),
  maxRedeemPercent: z.number().nullish(),
  mixedPaymentEnabled: z.boolean().nullish(),
});
export type PosSettings = z.infer<typeof posSettingsSchema>;

export const EARN_INPUT_MODES = [
  { id: "purchase_amount", label: "Сумма покупки" },
  { id: "points_amount", label: "Сразу баллы" },
  { id: "purchase_count", label: "Счётчик покупок" },
];

export const REDEEM_INPUT_MODES = [
  { id: "purchase_amount", label: "Сумма покупки" },
  { id: "points_amount", label: "Сразу баллы" },
  { id: "amount_bonus_payment", label: "Сумма, баллы и способ оплаты" },
];

export const updatePosSettingsInputSchema = z.object({
  earnInputMode: z.string(),
  redeemInputMode: z.string(),
  maxRedeemPercent: z.union([z.literal(""), z.coerce.number().min(1).max(100)]).optional(),
  mixedPaymentEnabled: z.boolean(),
});
export type UpdatePosSettingsInput = z.infer<typeof updatePosSettingsInputSchema>;

/** Исходящий вызов в систему заведения, когда на карте что-то произошло у него. */
export const webhookSchema = z.looseObject({
  id: z.string(),
  url: z.string(),
  events: z.array(z.string()).default([]),
  /** Приходит только при создании — второй раз секрет не покажут. */
  secret: z.string().nullish(),
  createdAt: z.string().nullish(),
});
export type Webhook = z.infer<typeof webhookSchema>;

export const webhookDeliverySchema = z.looseObject({
  id: z.string(),
  event: z.string().nullish(),
  status: z.string().nullish(),
  responseStatus: z.number().nullish(),
  createdAt: z.string().nullish(),
});
export type WebhookDelivery = z.infer<typeof webhookDeliverySchema>;

export const WEBHOOK_EVENTS = [
  { id: "points_changed", label: "Изменился баланс" },
  { id: "card_issued", label: "Выпущена карта" },
  { id: "card_revoked", label: "Карта отозвана" },
];

export const createWebhookInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Введите адрес")
    .max(500, "Слишком длинный адрес")
    .refine((value) => /^https?:\/\/\S+\.\S+/i.test(value), "Нужен полный адрес, например https://example.kg/hook")
    .refine(
      (value) => !/^http:\/\//i.test(value) || /localhost|127\.0\.0\.1/.test(value),
      "Для боевого адреса нужен https",
    ),
  events: z.array(z.string()).min(1, "Выберите хотя бы одно событие"),
});
export type CreateWebhookInput = z.infer<typeof createWebhookInputSchema>;
