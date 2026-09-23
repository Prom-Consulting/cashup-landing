import { z } from "zod";

/**
 * Схемы ответов описаны как looseObject: бэкенд добавляет поля чаще, чем мы их
 * читаем, и лишний ключ не должен ронять экран. Отсутствующий или неверный по
 * типу ключ — наоборот, ошибка: значит контракт разошёлся.
 */

/** Роль на уровне платформы (поле role в JWT). */
export const platformRoleSchema = z.enum(["super_admin", "store_admin", "store_staff", "api"]);
export type PlatformRole = z.infer<typeof platformRoleSchema>;

/** Роль внутри магазина. partner — отдельный бизнес со своим кабинетом. */
export const storeMemberRoleSchema = z.enum(["admin", "staff", "partner", "partner_employee"]);
export type StoreMemberRole = z.infer<typeof storeMemberRoleSchema>;

export const membershipSchema = z.looseObject({
  memberId: z.string(),
  storeId: z.string(),
  role: storeMemberRoleSchema,
  permissions: z.record(z.string(), z.boolean()).default({}),
});
export type Membership = z.infer<typeof membershipSchema>;

/** Содержимое токена, оно же ответ GET /auth/me. */
export const sessionSchema = z.looseObject({
  sub: z.string(),
  email: z.string(),
  role: platformRoleSchema,
  stores: z.array(membershipSchema).default([]),
});
export type Session = z.infer<typeof sessionSchema>;

export const profileSchema = z.looseObject({
  id: z.string(),
  email: z.string(),
  fullName: z.string().nullish(),
  role: platformRoleSchema,
});
export type Profile = z.infer<typeof profileSchema>;

/** expiresIn приходит строкой jsonwebtoken — «12h», не секундами. */
export const authTokensSchema = z.looseObject({
  accessToken: z.string(),
  expiresIn: z.string(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().min(1, "Введите почту").pipe(z.email("Похоже, в почте опечатка")),
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

/** Телефон бэкенд ждёт без плюса и пробелов: 996700000001. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length >= 9, "Введите номер телефона");

export const otpRequestInputSchema = z.object({ phone: phoneSchema });
export type OtpRequestInput = z.infer<typeof otpRequestInputSchema>;

/** Ответ на запрос кода: сколько секунд он живёт (по умолчанию 300). */
export const otpRequestResultSchema = z.looseObject({
  ok: z.boolean().optional(),
  expiresInSeconds: z.number().optional(),
});
export type OtpRequestResult = z.infer<typeof otpRequestResultSchema>;

export const otpLoginInputSchema = z.object({
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, "Код из шести цифр"),
});
export type OtpLoginInput = z.infer<typeof otpLoginInputSchema>;

/**
 * Регистрация. Перед ней обязателен запрос кода на тот же телефон: код одноразовый,
 * успешная регистрация его поглощает. Код приглашения делает человека владельцем магазина,
 * без него получается обычный сотрудник без доступа к кабинету.
 */
export const registerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя"),
  email: z.string().trim().min(1, "Введите почту").pipe(z.email("Похоже, в почте опечатка")),
  password: z.string().min(8, "Не короче 8 символов"),
  phone: phoneSchema,
  otp: z.string().trim().regex(/^\d{6}$/, "Код из шести цифр"),
  inviteCode: z.string().trim().optional(),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z.string().min(8, "Не короче 8 символов"),
    repeatPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((v) => v.newPassword === v.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(1, "Введите имя"),
  email: z.string().trim().pipe(z.email("Похоже, в почте опечатка")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
