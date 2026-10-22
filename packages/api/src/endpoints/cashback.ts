import type { ApiClient } from "../http";
import {
  cashbackPercentInputSchema,
  cashbackPercentSchema,
  tillCashbackInputSchema,
  tillCashbackResultSchema,
  type CashbackPercentInput,
  type TillCashbackForm,
} from "../schemas/cashback";

export const cashbackApi = (api: ApiClient) => ({
  /**
   * Кэшбэк за покупку деньгами. Магазин и кассира сервер берёт из токена; `branchId` — выбранный
   * филиал, если их несколько. Отказы: 403 TARIFF_NO_CASHBACK / MERCHANT_ACCESS_INACTIVE,
   * 404 — карты нет, 409 CARD_FROZEN.
   */
  accrue: (input: TillCashbackForm & { branchId?: string }) => {
    const form = tillCashbackInputSchema.parse(input);
    return api.request(tillCashbackResultSchema, `/v1/cards/${encodeURIComponent(form.cardSerialNumber)}/scan-confirm`, {
      method: "POST",
      body: { purchaseAmount: form.amount, ...(input.branchId ? { branchId: input.branchId } : {}) },
    });
  },

  /** Процент кэшбэка партнёра — только агентству. */
  percent: (merchantId: string) =>
    api.request(cashbackPercentSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/cashback-percent`),
  setPercent: (merchantId: string, input: CashbackPercentInput) => {
    const { percent } = cashbackPercentInputSchema.parse(input);
    return api.request(cashbackPercentSchema, `/admin/v1/merchants/${encodeURIComponent(merchantId)}/cashback-percent`, {
      method: "PUT",
      body: { percent: percent === "" ? null : percent },
    });
  },
});
