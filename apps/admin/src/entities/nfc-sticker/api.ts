import { nfcStickerApi, type StickerStatus } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useQuery } from "@tanstack/react-query";

export const nfcStickerKeys = { list: (status: string) => ["nfc-sticker-orders", status] as const };

/** Заказы NFC-стикеров для супер-админа: по умолчанию только оплаченные (их печатают). */
export function useNfcStickerOrders(status: StickerStatus | "all") {
  const api = useApi();
  return useQuery({
    queryKey: nfcStickerKeys.list(status),
    queryFn: () => nfcStickerApi(api).adminList(status),
  });
}
