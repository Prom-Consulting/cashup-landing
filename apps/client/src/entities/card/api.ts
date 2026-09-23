import { passesApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useQuery } from "@tanstack/react-query";
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

/** Ссылка на файл .pkpass: по ней браузер сам предлагает добавить карту в Wallet. */
export function appleWalletUrl(serial: string) {
  return `${API_URL.replace(/\/$/, "")}/v1/public/passes/${encodeURIComponent(serial)}`;
}
