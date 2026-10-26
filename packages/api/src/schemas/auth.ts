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
  /** Привязанный Google для входа (только сотрудники магазинов); старый шлюз поля не отдаёт. */
  google: z.looseObject({ email: z.string().nullish() }).nullish(),
  /**
   * Пароль входа в кабинет партнёра: set — есть ли он, mustChange — временный из WhatsApp.
   * Старый шлюз поля не отдаёт — тогда ничего не требуем.
   */
  password: z.looseObject({ set: z.boolean(), mustChange: z.boolean() }).nullish(),
  /** Куда слать уведомления о событиях (не коды входа): мессенджер на выбор, почта — всегда дополнительно. */
  notifications: z.looseObject({ channel: z.string(), email: z.string().nullish() }).nullish(),
  /** Подтверждены ли номер и почта кодом. Старый шлюз полей не отдаёт — тогда ничего не просим. */
  phoneVerified: z.boolean().nullish(),
  emailVerified: z.boolean().nullish(),
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
  /** Вход по номеру и паролю: true — вошли временным паролем, кабинет попросит свой. */
  passwordMustChange: z.boolean().nullish(),
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

/** Куда прислать код: WhatsApp (по умолчанию) или Telegram. */
export const OTP_CHANNELS = ["whatsapp", "telegram"] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];
export const OTP_CHANNEL_LABELS: Record<OtpChannel, string> = { whatsapp: "WhatsApp", telegram: "Telegram" };

/** Какие каналы включены на сервере. Старый шлюз ответит 404 — тогда только WhatsApp. */
export const otpChannelsSchema = z.looseObject({
  whatsapp: z.boolean().default(true),
  telegram: z.boolean().default(false),
  /** Код на почту (подтверждение контакта) — только если на сервере есть ключ писем. */
  email: z.boolean().default(false),
});
export type OtpChannels = z.infer<typeof otpChannelsSchema>;

export const otpRequestInputSchema = z.object({ phone: phoneSchema, channel: z.enum(OTP_CHANNELS).optional() });
export type OtpRequestInput = z.input<typeof otpRequestInputSchema>;

/** Ответ на запрос кода: сколько секунд он живёт (по умолчанию 300) и куда ушёл. */
export const otpRequestResultSchema = z.looseObject({
  ok: z.boolean().optional(),
  expiresInSeconds: z.number().optional(),
  channel: z.string().nullish(),
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
  /** Клиент задаёт пароль при регистрации — потом вход по телефону и паролю. */
  password: z.string().min(8, "Не короче 8 символов").max(72, "Не длиннее 72 символов").optional(),
  /** REF-01: по приглашению. Тот же deviceId, что ушёл в visit, — по нему сервер отсекает самореферал. */
  referralCode: referralCodeSchema.optional(),
});
export type PhoneRegisterInput = { phone: string; otp: string; password?: string; referralCode?: string };

// Форма регистрации клиента: телефон + пароль (шаг 1) и код (шаг 2). Пароли должны совпасть.
const clientSignUpBase = z.object({
  phone: phoneSchema,
  password: z.string().min(8, "Не короче 8 символов").max(72, "Не длиннее 72 символов"),
  repeatPassword: z.string(),
});
export const clientSignUpStartSchema = clientSignUpBase.superRefine((v, ctx) => {
  if (v.password !== v.repeatPassword) ctx.addIssue({ code: "custom", path: ["repeatPassword"], message: "Пароли не совпадают" });
});
export const clientSignUpSchema = clientSignUpBase.extend({ otp: otpSchema }).superRefine((v, ctx) => {
  if (v.password !== v.repeatPassword) ctx.addIssue({ code: "custom", path: ["repeatPassword"], message: "Пароли не совпадают" });
});
export type ClientSignUpInput = { phone: string; password: string; repeatPassword: string; otp: string };

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

/** Правила нового пароля — одни для смены, первого пароля и сброса по коду. */
export const newPasswordSchema = z
  .string()
  .min(8, "Не короче 8 символов")
  .max(72, "Не длиннее 72 символов")
  .refine((value) => !/^\d+$/.test(value), "Пароль не может быть из одних цифр");

const samePassword = { message: "Пароли не совпадают", path: ["repeatPassword"] };

/** Вход в кабинет партнёра: номер и пароль. Длину на входе не проверяем — правила могли поменяться. */
export const phonePasswordLoginInputSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Введите пароль"),
});
export type PhonePasswordLoginInput = z.infer<typeof phonePasswordLoginInputSchema>;

/** Свой пароль вместо временного или впервые — без текущего (POST /auth/me/password/setup). */
export const passwordSetupInputSchema = z
  .object({ newPassword: newPasswordSchema, repeatPassword: z.string().min(1, "Повторите пароль") })
  .refine((v) => v.newPassword === v.repeatPassword, samePassword);
export type PasswordSetupInput = z.infer<typeof passwordSetupInputSchema>;

/** «Нет пароля или забыли»: код на номер и сразу новый пароль (POST /auth/password/reset). */
export const passwordResetInputSchema = z
  .object({
    phone: phoneSchema,
    otp: otpSchema,
    newPassword: newPasswordSchema,
    repeatPassword: z.string().min(1, "Повторите пароль"),
  })
  .refine((v) => v.newPassword === v.repeatPassword, samePassword);
export type PasswordResetInput = z.infer<typeof passwordResetInputSchema>;

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Введите текущий пароль"),
    newPassword: newPasswordSchema,
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

/** Ответ привязки Google: почта того аккаунта, что теперь открывает вход. */
export const googleLinkSchema = z.looseObject({
  google: z.looseObject({ email: z.string().nullish() }),
});

/** «Подтвердите почту или номер»: текущий или новый номер (WhatsApp, Telegram) либо почта. */
export const CONTACT_KINDS = ["phone", "email"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];
export type ContactCodeInput = { kind: ContactKind; value: string; channel?: OtpChannel };
export type ContactVerifyInput = { kind: ContactKind; value: string; code: string };

export const notificationSettingsSchema = z.looseObject({ channel: z.string(), email: z.string().nullish() });
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
