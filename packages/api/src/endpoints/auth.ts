import { z } from "zod";
import { getDeviceId } from "../device";
import type { ApiClient } from "../http";
import {
  authTokensSchema,
  otpRequestResultSchema,
  registerInputSchema,
  otpLoginInputSchema,
  otpRequestInputSchema,
  phoneRegisterInputSchema,
  profileSchema,
  sessionSchema,
  updateProfileInputSchema,
  type ChangePasswordInput,
  type LoginInput,
  type OtpLoginInput,
  type OtpRequestInput,
  type PhoneRegisterInput,
  type RegisterInput,
  type UpdateProfileInput, phoneCheckResultSchema, googleLinkSchema } from "../schemas/auth";

/**
 * Вход один на все кабинеты: почта с паролем или телефон с кодом из WhatsApp.
 * В обоих случаях уходит deviceId — бэкенд держит одну активную сессию на аккаунт,
 * и вход с другого устройства гасит эту. Refresh-токена нет: на 401 нужен новый вход.
 */
export const authApi = (api: ApiClient) => ({
  /**
   * Есть ли у номера аккаунт — до регистрации, без кода. Только подсказка интерфейсу: войти
   * всё равно можно лишь по коду. 429 PHONE_CHECK_RATE_LIMITED (10 в минуту с IP) и
   * 503 PHONE_CHECK_UNAVAILABLE — не «номера нет», а «не знаем»: продолжаем без подсказки.
   */
  checkPhone: (phone: string) =>
    api.request(phoneCheckResultSchema, "/auth/check-phone", {
      method: "POST",
      body: { phone: `+${phone.replace(/\D/g, "")}` },
      anonymous: true,
    }),

  /** Код живёт 5 минут, повторный запрос раньше 60 секунд — 429. На код даётся 5 попыток. */
  requestOtp: (input: OtpRequestInput) =>
    api.request(otpRequestResultSchema, "/auth/otp/request", {
      method: "POST",
      body: otpRequestInputSchema.parse(input),
      anonymous: true,
    }),

  /**
   * Регистрация клиента: только телефон и код. Сразу выдаёт токен — отдельный вход не нужен.
   * deviceId сервер принимает необязательным, но без него первый же вход заменит сессию.
   */
  registerByPhone: (input: PhoneRegisterInput) =>
    api.request(authTokensSchema, "/auth/register", {
      method: "POST",
      body: { ...phoneRegisterInputSchema.parse(input), deviceId: getDeviceId() },
      anonymous: true,
    }),

  /** Владелец заведения по коду приглашения — сразу получает доступ к кабинету. */
  register: (input: RegisterInput) =>
    api.request(authTokensSchema, "/auth/register-with-invite", {
      method: "POST",
      body: { ...registerInputSchema.parse(input), deviceId: getDeviceId() },
      anonymous: true,
    }),

  login: (input: LoginInput) =>
    api.request(authTokensSchema, "/auth/login", {
      method: "POST",
      body: { ...input, deviceId: getDeviceId() },
      anonymous: true,
    }),

  loginByOtp: (input: OtpLoginInput) =>
    api.request(authTokensSchema, "/auth/login", {
      method: "POST",
      body: { ...otpLoginInputSchema.parse(input), deviceId: getDeviceId() },
      anonymous: true,
    }),

  /**
   * Вход через Google — только сотрудникам магазинов, у которых Google уже привязан в профиле.
   * Регистрации через Google нет: 404 GOOGLE_NOT_LINKED — «войдите по номеру и привяжите».
   * 403 NOT_BUSINESS_ACCOUNT, 503 GOOGLE_SIGN_IN_DISABLED (прячем кнопку) / GOOGLE_UNAVAILABLE.
   */
  loginWithGoogle: (idToken: string) =>
    api.request(authTokensSchema, "/auth/google", {
      method: "POST",
      body: { idToken, deviceId: getDeviceId() },
      anonymous: true,
    }),

  /** Привязать Google к тому, кто вошёл. 409 IDENTITY_TAKEN — Google чужой или у человека уже другой. */
  linkGoogle: (idToken: string) =>
    api.request(googleLinkSchema, "/auth/me/google", { method: "POST", body: { idToken } }),

  /** Отвязать Google; 204 и тогда, когда привязки не было. */
  unlinkGoogle: () => api.request(z.undefined(), "/auth/me/google", { method: "DELETE" }),

  me: () => api.request(sessionSchema, "/auth/me"),

  profile: () => api.request(profileSchema, "/auth/me/profile"),

  /** Гасит сессию на сервере: и access, и refresh этого входа дальше получат 401. Ответ — 204. */
  logout: () => api.request(z.undefined(), "/auth/logout", { method: "POST" }),

  updateProfile: (input: UpdateProfileInput) => {
    const { fullName, email } = updateProfileInputSchema.parse(input);
    return api.request(authTokensSchema, "/auth/me", {
      method: "PUT",
      body: { fullName, ...(email === "" ? {} : { email }) },
    });
  },

  changePassword: ({ currentPassword, newPassword }: ChangePasswordInput) =>
    api.request(z.looseObject({ ok: z.boolean() }), "/auth/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    }),
});
