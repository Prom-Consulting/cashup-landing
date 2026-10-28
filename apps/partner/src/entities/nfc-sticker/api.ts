import { nfcStickerApi, type StickerKind } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const key = (merchantId: string) => ["merchant", merchantId, "nfc-sticker"] as const;

export function useNfcSticker(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: key(merchantId),
    queryFn: () => nfcStickerApi(api).get(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useSetStickerKind(merchantId: string) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: StickerKind) => nfcStickerApi(api).setKind(merchantId, kind),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(merchantId) }),
  });
}

export function usePayNfcSticker(merchantId: string) {
  const api = useApi();
  return useMutation({ mutationFn: () => nfcStickerApi(api).pay(merchantId) });
}
