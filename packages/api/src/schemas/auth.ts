import { z } from "zod";

/**
 * Схемы ответов описаны как looseObject: бэкенд добавляет поля чаще, чем мы их
 * читаем, и лишний ключ не должен ронять экран. Отсутствующий или неверный по
 * типу ключ — наоборот, ошибка: значит контракт разошёлся.
 */

/** Роль на уровне платформы (поле role в JWT). */
export const platformRoleSchema = z.enum(["super_admin", "store_admin", "store_staff", "api"]);
export type PlatformRole = z.infer<typeof platformRoleSchema>;

/** Роль внутри заведения. partner — отдельный бизнес со своим кабинетом. */
export const merchantMemberRoleSchema = z.enum(["admin", "staff", "partner", "partner_employee"]);
export type MerchantMemberRole = z.infer<typeof merchantMemberRoleSchema>;

export const membershipSchema = z.looseObject({
  memberId: z.string(),
  merchantId: z.string(),
  role: merchantMemberRoleSchema,
  permissions: z.record(z.string(), z.boolean()).default({}),
});
export type Membership = z.infer<typeof membershipSchema>;

/** Содержимое токена, оно же ответ GET /auth/me. */
export const sessionSchema = z.looseObject({
  sub: z.string(),
  email: z.string(),
  role: platformRoleSchema,
  /** Заведения, где человек работает. Раньше поле называлось stores. */
  merchants: z.array(membershipSchema).default([]),
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
  email: z.string().trim().toLowerCase().min(1, "Введите почту").pipe(z.email("Похоже, в почте опечатка")),
  /** На входе длину не проверяем: правила пароля могли поменяться с момента регистрации. */
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

/**
 * Телефон бэкенд ждёт цифрами, без плюса и пробелов: 996700000001. Принимаем оба
 * привычных вида записи — 0700 12 34 56 и +996 700 123 456 — и приводим к одному.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Введите номер телефона")
  .transform((value) => {
    // Поле уже показывает +996, поэтому человек может дописать и 0700…, и 700…
    let local = value.replace(/\D/g, "");
    if (local.startsWith("996")) local = local.slice(3);
    if (local.startsWith("0")) local = local.slice(1);
    // Если цифр не девять, возвращаем как есть: проверка ниже должна отклонить номер,
    // а не «починить» его до чужого
    return local.length === 9 ? `996${local}` : local;
  })
  .refine((digits) => /^996\d{9}$/.test(digits), "Проверьте номер: девять цифр после +996");

/** Код из сообщения: ровно шесть цифр, иначе сервер всё равно откажет. */
export const otpSchema = z
  .string()
  .trim()
  .min(1, "Введите код из сообщения")
  .regex(/^\d{6}$/, "В коде шесть цифр");

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
  otp: otpSchema,
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
  otp: otpSchema,
  inviteCode: z.string().trim().optional(),
});
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: z
      .string()
      .min(8, "Не короче 8 символов")
      .max(72, "Не длиннее 72 символов")
      .refine((value) => !/^\d+$/.test(value), "Пароль не может быть из одних цифр"),
    repeatPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((v) => v.newPassword === v.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Новый пароль совпадает с текущим",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя").max(80, "Слишком длинное имя"),
  email: z.string().trim().toLowerCase().pipe(z.email("Похоже, в почте опечатка")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
