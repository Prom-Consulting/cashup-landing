import {
  merchantCabinetApi,
  merchantsApi,
  type BuyMonthsInput,
  type CreateMerchantInput,
  type DeductionQuery,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Заведения платформы. Клиенты и карты сюда не входят — они платформенные. */
export const merchantKeys = {
  all: ["merchants"] as const,
  detail: (id: string) => ["merchants", id] as const,
  members: (id: string) => ["merchants", id, "members"] as const,
  invites: (id: string) => ["merchants", id, "invites"] as const,
  subscription: (id: string) => ["merchants", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchants", id, "deductions", query] as const,
};

export function useMerchants() {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.all, queryFn: () => merchantsApi(api).list() });
}

export function useMerchant(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.detail(merchantId), queryFn: () => merchantsApi(api).get(merchantId) });
}

export function useCreateMerchant() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMerchantInput) => merchantsApi(api).create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.all }),
  });
}

export function useSuspendMerchant(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantsApi(api).suspend(merchantId),
    onSuccess: (merchant) => {
      queryClient.setQueryData(merchantKeys.detail(merchantId), merchant);
      queryClient.invalidateQueries({ queryKey: merchantKeys.all });
    },
  });
}

export function useMerchantMembers(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.members(merchantId), queryFn: () => merchantsApi(api).members(merchantId) });
}

export function useMerchantInvites(merchantId: string) {
  const api = useApi();
  return useQuery({ queryKey: merchantKeys.invites(merchantId), queryFn: () => merchantsApi(api).invites(merchantId) });
}

export function useCreateInvite(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantsApi(api).createInvite(merchantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.invites(merchantId) }),
  });
}

/** Подписка заведения: пока isActive false, оно не принимает бонусы. */
export function useMerchantSubscription(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.subscription(merchantId),
    queryFn: () => merchantCabinetApi(api).subscription(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** Выдача доступа без оплаты — то, чем платформа включает заведение вручную. */
export function useGrantSubscription(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyMonthsInput) => merchantCabinetApi(api).grantSubscription(merchantId, input),
    onSuccess: (data) => queryClient.setQueryData(merchantKeys.subscription(merchantId), data),
  });
}

export function useMerchantDeductions(merchantId: string, query: DeductionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.deductions(merchantId, query),
    queryFn: () => merchantCabinetApi(api).deductions(merchantId, query),
    enabled: Boolean(merchantId),
    placeholderData: (previous) => previous,
  });
}
