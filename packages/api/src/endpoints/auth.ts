import { z } from "zod";
import { getDeviceId } from "../device";
import type { ApiClient } from "../http";
import {
  authTokensSchema,
  otpLoginInputSchema,
  otpRequestInputSchema,
  profileSchema,
  sessionSchema,
  type ChangePasswordInput,
  type LoginInput,
  type OtpLoginInput,
  type OtpRequestInput,
  type UpdateProfileInput,
} from "../schemas/auth";

/**
 * Вход один на все кабинеты: почта с паролем или телефон с кодом из WhatsApp.
 * В обоих случаях уходит deviceId — бэкенд держит одну активную сессию на аккаунт,
 * и вход с другого устройства гасит эту. Refresh-токена нет: на 401 нужен новый вход.
 */
export const authApi = (api: ApiClient) => ({
  /** Код живёт 5 минут, повторный запрос раньше 60 секунд — 429. */
  requestOtp: (input: OtpRequestInput) =>
    api.request(z.looseObject({}).or(z.null()), "/auth/otp/request", {
      method: "POST",
      body: otpRequestInputSchema.parse(input),
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

  updateProfile: (input: UpdateProfileInput) => api.request(authTokensSchema, "/auth/me", { method: "PUT", body: input }),

  changePassword: ({ currentPassword, newPassword }: ChangePasswordInput) =>
    api.request(z.looseObject({ ok: z.boolean() }), "/auth/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    }),
});
