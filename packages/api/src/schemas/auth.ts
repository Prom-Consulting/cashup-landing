import { z } from "zod";
import { phoneSchema } from "./phone";

/** Телефон — общий для всех схем, правила в ./phone. */
export { phoneSchema };

/**
 * Схемы ответов описаны как looseObject: бэкенд добавляет поля чаще, чем мы их
 * читаем, и лишний ключ не должен ронять экран. Отсутствующий или неверный по
 * типу ключ — наоборот, ошибка: значит контракт разошёлся.
 */

/** Роль на уровне платформы (поле role в JWT). */
export const platformRoleSchema = z.enum(["super_admin", "store_admin", "store_staff", "api"]);
export type PlatformRole = z.infer<typeof platformRoleSchema>;

/**
 * Роль внутри заведения: admin — владелец, branch_admin — администратор филиала, staff — кассир.
 * Строка, а не enum: старый токен с ролью, которой больше нет (partner), не должен ронять вход —
 * такой человек просто не попадёт ни в один кабинет магазина.
 */
export const MERCHANT_ROLES = ["admin", "branch_admin", "staff"] as const;
export type MerchantMemberRole = (typeof MERCHANT_ROLES)[number];
export const merchantMemberRoleSchema = z.string();

export const membershipSchema = z.looseObject({
  memberId: z.string(),
  merchantId: z.string(),
  role: merchantMemberRoleSchema,
  /**
   * Филиалы сотрудника: один человек может работать в нескольких филиалах одного магазина.
   * У владельца пусто — ему открыт весь магазин. Старый токен этого поля не знает.
   */
  branchIds: z.array(z.string()).default([]),
  /** Прежнее поле: единственный филиал, иначе null. Читать через membershipBranchIds. */
  branchId: z.string().nullish(),
  permissions: z.record(z.string(), z.boolean()).default({}),
});
export type Membership = z.infer<typeof membershipSchema>;

/** Филиалы членства: новое branchIds, а для старого токена — его единственный branchId. */
export const membershipBranchIds = (membership: Pick<Membership, "branchIds" | "branchId">): string[] =>
  membership.branchIds.length > 0 ? membership.branchIds : membership.branchId ? [membership.branchId] : [];

/** Проверка номера до регистрации: есть ли у него аккаунт платформы. */
export const phoneCheckResultSchema = z.looseObject({ exists: z.boolean() });
export type PhoneCheckResult = z.infer<typeof phoneCheckResultSchema>;

/** Содержимое токена, оно же ответ GET /auth/me. */
export const sessionSchema = z.looseObject({
  sub: z.string(),
  /** null у клиента, зарегистрированного по телефону: почты у него нет. */
  email: z.string().nullish(),
  role: platformRoleSchema,
  /** Заведения, где человек работает. Раньше поле называлось stores. */
  merchants: z.array(membershipSchema).default([]),
});
export type Session = z.infer<typeof sessionSchema>;

export const profileSchema = z.looseObject({
  id: z.string(),
  email: z.string().nullish(),
  /** Телефон аккаунта, 996…; старый шлюз его не отдавал. */
  phone: z.string().nullish(),
  fullName: z.string().nullish(),
  role: platformRoleSchema,
});
export type Profile = z.infer<typeof profileSchema>;

/** expiresIn приходит строкой jsonwebtoken — «12h», не секундами. */
export const authTokensSchema = z.looseObject({
  accessToken: z.string(),
  expiresIn: z.string(),
  /** Вход по телефону: true — аккаунт только что создан. Вход по почте поля не присылает. */
  isNewAccount: z.boolean().optional(),
  /** 30 дней; меняется при каждом refresh. Старые ответы без него — сессия просто не продлится. */
  refreshToken: z.string().nullish(),
  refreshExpiresIn: z.string().nullish(),
  /** Первый вход человека, которого заранее завёл администратор: аккаунт активирован. */
  registrationCompleted: z.boolean().nullish(),
  message: z.string().nullish(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Введите почту").pipe(z.email("Похоже, в почте опечатка")),
  /** На входе длину не проверяем: правила пароля могли поменяться с момента регистрации. */
  password: z.string().min(1, "Введите пароль"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

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

export const otpLoginInputSchema = z.object({ phone: phoneSchema, otp: otpSchema });
export type OtpLoginInput = z.infer<typeof otpLoginInputSchema>;

/**
 * Регистрация по телефону — всё, что нужно клиенту: номер и код из WhatsApp. Сервер
 * принимает ровно эти поля (плюс deviceId), лишние дают 400. Код одноразовый.
 */
/** Код приглашения из ссылки /ref/{code}: латиница, цифры, дефис и подчёркивание. */
export const referralCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{3,64}$/, "Ссылка приглашения повреждена");

export const phoneRegisterInputSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  /** REF-01: по приглашению. Тот же deviceId, что ушёл в visit, — по нему сервер отсекает самореферал. */
  referralCode: referralCodeSchema.optional(),
});
export type PhoneRegisterInput = { phone: string; otp: string; referralCode?: string };

/**
 * Регистрация владельца заведения по коду приглашения: почта, пароль, телефон и код
 * из WhatsApp. Без приглашения регистрируются только по телефону (phoneRegisterInputSchema).
 */
export const registerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя"),
  email: z.string().trim().min(1, "Введите почту").pipe(z.email("Похоже, в почте опечатка")),
  password: z.string().min(8, "Не короче 8 символов"),
  phone: phoneSchema,
  otp: otpSchema,
  inviteCode: z.string().trim().min(1, "Введите код приглашения"),
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
  .refine((v) => v.newPassword === v.repeatPassword, { message: "Пароли не совпадают", path: ["repeatPassword"] })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Новый пароль совпадает с текущим",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;

/** Имя и почта. Почта занята другим аккаунтом — 409, показываем у поля. Пустую почту не шлём. */
export const updateProfileInputSchema = z.object({
  fullName: z.string().trim().min(2, "Введите имя").max(80, "Слишком длинное имя"),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().pipe(z.email("Похоже, в почте опечатка"))]),
});
export type UpdateProfileInput = { fullName: string; email: string };
