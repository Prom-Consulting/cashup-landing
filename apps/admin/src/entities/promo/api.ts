import { promoApi, type CreatePromoForm, type PromoAudience, type UpdatePromoInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type PromoQuery = { audience?: PromoAudience; includeDeleted?: boolean };

/** Промокоды — платформенные, только агентству. */
export const promoKeys = {
  all: ["promo-codes"] as const,
  list: (query: PromoQuery) => ["promo-codes", "list", query] as const,
  redemptions: (id: string) => ["promo-codes", id, "redemptions"] as const,
};

export function usePromoCodes(query: PromoQuery) {
  const api = useApi();
  return useQuery({
    queryKey: promoKeys.list(query),
    queryFn: () => promoApi(api).list(query),
    placeholderData: (previous) => previous,
  });
}

export function usePromoRedemptions(id: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: promoKeys.redemptions(id ?? ""),
    queryFn: () => promoApi(api).redemptions(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePromo() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreatePromoForm) => promoApi(api).create(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function useUpdatePromo() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePromoInput }) => promoApi(api).update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.all }),
  });
}

export function useDeletePromo() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promoApi(api).remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: promoKeys.all }),
  });
}
