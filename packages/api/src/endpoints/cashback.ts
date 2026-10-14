import type { ApiClient } from "../http";
import {
  cashbackJournalPageSchema,
  cashbackSettingsInputSchema,
  cashbackSettingsSchema,
  tillCashbackInputSchema,
  tillCashbackResultSchema,
  type CashbackSettingsInput,
  type TillCashbackForm,
} from "../schemas/cashback";

/**
 * Кэшбэк на кассе. Заведение, как и при списании, сервер берёт из токена: `merchantId` —
 * только если человек работает в нескольких, `branchId` — выбранный филиал. Отказы:
 * 404 CARD_NOT_FOUND, 409 NO_ACTIVE_SUBSCRIPTION / CARD_FROZEN / CASHBACK_DAILY_LIMIT /
 * TARIFF_NO_CASHBACK, 400 AMOUNT_TOO_SMALL.
 */
export const cashbackApi = (api: ApiClient) => ({
  accrue: (input: TillCashbackForm & { merchantId?: string; branchId?: string }) => {
    const { merchantId, branchId, ...form } = input;
    return api.request(tillCashbackResultSchema, "/v1/cashback", {
      method: "POST",
      body: { ...tillCashbackInputSchema.parse(form), ...(merchantId ? { merchantId } : {}), ...(branchId ? { branchId } : {}) },
    });
  },

  /** Журнал начислений заведения: владельцу — всё, администратору филиала — его филиалы. */
  journal: (merchantId: string, query: { page: number; pageSize: number }) =>
    api.request(cashbackJournalPageSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/cashback`, { query }),

  /** Только агентству. */
  settings: () => api.request(cashbackSettingsSchema, "/admin/v1/tariffs/cashback"),
  setSettings: (input: CashbackSettingsInput) =>
    api.request(cashbackSettingsSchema, "/admin/v1/tariffs/cashback", {
      method: "PATCH",
      body: cashbackSettingsInputSchema.parse(input),
    }),
});
