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
  type ChangePasswordInput,
  type LoginInput,
  type OtpLoginInput,
  type OtpRequestInput,
  type PhoneRegisterInput,
  type RegisterInput,
  type UpdateProfileInput,
} from "../schemas/auth";

/**
 * Вход один на все кабинеты: почта с паролем или телефон с кодом из WhatsApp.
 * В обоих случаях уходит deviceId — бэкенд держит одну активную сессию на аккаунт,
 * и вход с другого устройства гасит эту. Refresh-токена нет: на 401 нужен новый вход.
 */
export const authApi = (api: ApiClient) => ({
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

  me: () => api.request(sessionSchema, "/auth/me"),

  profile: () => api.request(profileSchema, "/auth/me/profile"),

  updateProfile: (input: UpdateProfileInput) =>
    api.request(authTokensSchema, "/auth/me", { method: "PUT", body: input }),

  changePassword: ({ currentPassword, newPassword }: ChangePasswordInput) =>
    api.request(z.looseObject({ ok: z.boolean() }), "/auth/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    }),
});
