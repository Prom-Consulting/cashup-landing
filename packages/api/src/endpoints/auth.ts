import { z } from "zod";
import type { ApiClient } from "../http";
import {
  authTokensSchema,
  profileSchema,
  sessionSchema,
  type ChangePasswordInput,
  type LoginInput,
  type UpdateProfileInput,
} from "../schemas/auth";

/**
 * Вход один на все кабинеты: почта и пароль, в ответ токен на 12 часов.
 * Refresh-токена у бэкенда нет — по 401 кабинет отправляет на страницу входа.
 */
export const authApi = (api: ApiClient) => ({
  login: (input: LoginInput) => api.request(authTokensSchema, "/auth/login", { method: "POST", body: input, anonymous: true }),

  me: () => api.request(sessionSchema, "/auth/me"),

  profile: () => api.request(profileSchema, "/auth/me/profile"),

  updateProfile: (input: UpdateProfileInput) => api.request(authTokensSchema, "/auth/me", { method: "PUT", body: input }),

  changePassword: ({ currentPassword, newPassword }: ChangePasswordInput) =>
    api.request(z.looseObject({ ok: z.boolean() }), "/auth/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    }),
});
