import { cardsApi, passesApi, type BuyMonthsInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery } from "@tanstack/react-query";
import { API_URL } from "../../shared/config/env";

export const cardKeys = { info: (serial: string) => ["pass", serial] as const };

/** Карта по серийному номеру — публичная ручка, токен не нужен. */
export function usePassInfo(serial: string) {
  const api = useApi();
  return useQuery({
    queryKey: cardKeys.info(serial),
    queryFn: () => passesApi(api).info(serial),
    enabled: serial.length > 0,
    retry: false,
  });
}

/**
 * Счёт на подписку. Оплата уходит в OctōPAY, баллы включает его колбэк —
 * поэтому после возврата страницу нужно просто перечитать.
 */
export function usePaySubscription(serial: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: BuyMonthsInput) => cardsApi(api).paySubscription(serial, input),
  });
}

/** Ссылка на файл .pkpass: по ней браузер сам предлагает добавить карту в Wallet. */
export function appleWalletUrl(serial: string) {
  return `${API_URL.replace(/\/$/, "")}/v1/public/passes/${encodeURIComponent(serial)}`;
}
