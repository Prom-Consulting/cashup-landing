import { z } from "zod";
import type { ApiClient } from "../http";
import {
  codeSentSchema,
  merchantListItemSchema,
  octopayTransferResultSchema,
  rejectInputSchema,
  rejectResultSchema,
  restorePreviewSchema,
  restoreResultSchema,
  type OctopayFate,
  type RejectInput,
  createMerchantInputSchema,
  merchantInviteSchema,
  merchantMemberSchema,
  merchantSchema,
  updateMerchantInputSchema,
  type CreateMerchantInput,
  type UpdateMerchantInput,
} from "../schemas/merchant";

/** Пустое поле формы — «не указано»: сервер принимает null, но не пустую строку. */
const orNull = (value: string | undefined) =>
  value === undefined ? undefined : value.trim() === "" ? null : value.trim();

/**
 * Заведения. Список и создание — только у агентства; карточку заведения видит и оно
 * само. Клиенты, карты и шаблоны сюда больше не входят: они принадлежат платформе.
 */
export const merchantsApi = (api: ApiClient) => ({
  /** includeDeleted — вместе с архивом удалённых магазинов. */
  list: (options: { includeDeleted?: boolean } = {}) =>
    api.request(z.array(merchantSchema), `/admin/v1/merchants${options.includeDeleted ? "?includeDeleted=true" : ""}`),

  /**
   * Список с заявками: includeApplications добавляет заявки без заведения (kind: "application"),
   * у каждого магазина — kind: "merchant". Только агентство.
   */
  listWithApplications: (options: { includeDeleted?: boolean } = {}) =>
    api.request(z.array(merchantListItemSchema), "/admin/v1/merchants", {
      query: { includeApplications: "true", includeDeleted: options.includeDeleted ? "true" : undefined },
    }),

  /**
   * Отклонить заведение, которое ждёт проверки: архив, номер владельца свободен, причина уходит
   * в WhatsApp. 409 MERCHANT_NOT_PENDING_REVIEW — уже одобрено. Повтор при ownerNotified: false
   * отправляет сообщение снова. Только супер-админ.
   */
  reject: (merchantId: string, input: RejectInput) =>
    api.request(rejectResultSchema, `/admin/v1/merchants/${merchantId}/reject`, {
      method: "POST",
      body: rejectInputSchema.parse(input),
    }),

  /** То же для заявки без заведения. 409 REGISTRATION_HAS_MERCHANT / REGISTRATION_COMPLETED. */
  rejectRegistration: (registrationId: string, input: RejectInput) =>
    api.request(rejectResultSchema, `/admin/v1/partner-registrations/${registrationId}/reject`, {
      method: "POST",
      body: rejectInputSchema.parse(input),
    }),

  /** Вернуть архивный магазин (до 30 дней): что вернётся, кто занят, что будет с OctōPAY. */
  restorePreview: (merchantId: string) =>
    api.request(restorePreviewSchema, `/admin/v1/merchants/${merchantId}/restore-preview`),

  /** Код на новый номер, который займёт место memberId (без memberId — новый владелец). */
  restorePhoneCode: (merchantId: string, input: { phone: string; memberId?: string }) =>
    api.request(codeSentSchema, `/admin/v1/merchants/${merchantId}/restore/phone-code`, {
      method: "POST",
      body: { phone: `+${input.phone.replace(/\D/g, "")}`, ...(input.memberId ? { memberId: input.memberId } : {}) },
    }),

  restore: (merchantId: string, replacements: { memberId?: string; phone: string; code: string }[] = []) =>
    api.request(restoreResultSchema, `/admin/v1/merchants/${merchantId}/restore`, {
      method: "POST",
      body: replacements.length
        ? {
            replacements: replacements.map((item) => ({
              ...(item.memberId ? { memberId: item.memberId } : {}),
              phone: `+${item.phone.replace(/\D/g, "")}`,
              code: item.code,
            })),
          }
        : {},
    }),

  /** Перенести аккаунт OctōPAY с другого магазина на этот. 409 TARGET_ALREADY_LINKED, 404 ACCOUNT_NOT_FOUND. */
  transferOctopay: (merchantId: string, fromMerchantId: string) =>
    api.request(octopayTransferResultSchema, `/admin/v1/merchants/${merchantId}/octopay/transfer`, {
      method: "POST",
      body: { fromMerchantId },
    }),

  /**
   * Смена номера сотрудника — только супер-админ: код уходит в WhatsApp на новый номер.
   * 409 PHONE_HAS_ACTIVE_MERCHANT — номер занят (код не отправлен), 400 SAME_PHONE.
   */
  memberPhoneCode: (merchantId: string, memberId: string, phone: string) =>
    api.request(codeSentSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}/phone-code`, {
      method: "POST",
      body: { phone: `+${phone.replace(/\D/g, "")}` },
    }),

  /** Место сотрудника переходит к человеку с новым номером: новый id, та же роль и филиалы. */
  replaceMemberPhone: (merchantId: string, memberId: string, input: { phone: string; code: string }) =>
    api.request(merchantMemberSchema, `/admin/v1/merchants/${merchantId}/members/${memberId}/phone`, {
      method: "PUT",
      body: { phone: `+${input.phone.replace(/\D/g, "")}`, code: input.code },
    }),

  get: (merchantId: string) => api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`),

  create: (input: CreateMerchantInput) =>
    api.request(merchantSchema, "/admin/v1/merchants", {
      method: "POST",
      body: (() => {
        const parsed = createMerchantInputSchema.parse(input);
        return { ...parsed, contactEmail: orNull(parsed.contactEmail) };
      })(),
    }),

  update: (merchantId: string, input: UpdateMerchantInput) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}`, {
      method: "PATCH",
      body: (() => {
        const parsed = updateMerchantInputSchema.parse(input);
        return { ...parsed, contactEmail: orNull(parsed.contactEmail), contactPhone: orNull(parsed.contactPhone) };
      })(),
    }),

  /**
   * В архив: магазин, филиалы и все членства закрываются, сессии сотрудников гаснут, номера людей
   * сразу свободны. Аккаунты, карты, подписки и балансы клиентов остаются. Вернуть можно 30 дней.
   * octopay: keep — только разорвать связь с OctōPAY, delete — ещё и закрыть аккаунт OctōPAY.
   */
  remove: (merchantId: string, octopay: OctopayFate = "keep") =>
    api.request(
      z.looseObject({ id: z.string(), slug: z.string().nullish(), deletedAt: z.string().nullish() }).or(z.null()),
      `/admin/v1/merchants/${merchantId}`,
      { method: "DELETE", query: { octopay } },
    ),

  suspend: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/suspend`, { method: "POST", body: {} }),

  /** Обратно в работу после приостановки. Только агентство. */
  activate: (merchantId: string) =>
    api.request(merchantSchema, `/admin/v1/merchants/${merchantId}/activate`, { method: "POST", body: {} }),

  members: (merchantId: string) =>
    api.request(z.array(merchantMemberSchema), `/admin/v1/merchants/${merchantId}/members`),

  invites: (merchantId: string) =>
    api.request(z.array(merchantInviteSchema), `/admin/v1/merchants/${merchantId}/invites`),

  createInvite: (merchantId: string) =>
    api.request(merchantInviteSchema, `/admin/v1/merchants/${merchantId}/invites`, { method: "POST", body: {} }),
});
