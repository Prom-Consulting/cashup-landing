import { z } from "zod";
import { phoneSchema } from "./phone";

/**
 * Филиал — физическая точка. У него свой администратор (branch_admin) и кассиры (staff).
 * Закрытый филиал не стирается: archivedAt, прошлые операции на него ссылаются.
 */
export const branchSchema = z.looseObject({
  id: z.string(),
  merchantId: z.string(),
  name: z.string(),
  createdAt: z.string().nullish(),
  archivedAt: z.string().nullish(),
});
export type Branch = z.infer<typeof branchSchema>;

export const createBranchInputSchema = z.object({
  name: z.string().trim().min(2, "Введите название филиала").max(80, "Слишком длинное название"),
});
export type CreateBranchInput = z.infer<typeof createBranchInputSchema>;

/**
 * Человека заводят заранее по имени и телефону: номер резервируется, и когда он впервые войдёт
 * по коду из WhatsApp, аккаунт уже будет с ролью и филиалами. Один человек может работать в
 * нескольких филиалах, но только одного магазина (`409 EMPLOYEE_ALREADY_ASSIGNED`).
 * Администратору филиалов нужен хотя бы один филиал; сам он добавляет только кассиров и только
 * в свои филиалы — пустой список сервер заменит всеми его филиалами.
 */
export const addMemberInputSchema = z
  .object({
    fullName: z.string().trim().min(2, "Введите имя").max(120, "Слишком длинное имя"),
    phone: phoneSchema,
    role: z.enum(["admin", "branch_admin", "staff"]),
    branchIds: z.array(z.string().trim().min(1)).max(100, "Не больше 100 филиалов").default([]),
  })
  .refine((input) => input.role !== "branch_admin" || input.branchIds.length > 0, {
    path: ["branchIds"],
    message: "Выберите хотя бы один филиал — администратор отвечает за свои филиалы",
  });
export type AddMemberInput = z.infer<typeof addMemberInputSchema>;

export const MEMBER_ROLE_LABELS: Record<string, string> = {
  admin: "Владелец",
  branch_admin: "Администратор филиала",
  staff: "Кассир",
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
