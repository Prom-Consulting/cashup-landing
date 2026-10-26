import { businessReferralsApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** «Приведи заведение» — кабинет реферера (владелец). */
export const businessReferralKeys = {
  dashboard: (merchantId: string) => ["merchant", merchantId, "business-referrals"] as const,
};

export function useBusinessReferrals(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: businessReferralKeys.dashboard(merchantId),
    queryFn: () => businessReferralsApi(api).dashboard(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useEnrollBusinessReferrals(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => businessReferralsApi(api).enroll(merchantId),
    onSuccess: (data) => queryClient.setQueryData(businessReferralKeys.dashboard(merchantId), data),
  });
}
