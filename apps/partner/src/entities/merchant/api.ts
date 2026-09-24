import {
  merchantCabinetApi,
  merchantsApi,
  redemptionsApi,
  type RedemptionForm,
  type AddMemberInput,
  type AddPartnerInput,
  type CreateBranchInput,
  type CreateInvoiceInput,
  type CreateWebhookInput,
  type DeductionQuery,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const merchantKeys = {
  detail: (id: string) => ["merchant", id] as const,
  subscription: (id: string) => ["merchant", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchant", id, "deductions", query] as const,
  invoices: (id: string) => ["merchant", id, "invoices"] as const,
  onec: (id: string) => ["merchant", id, "onec"] as const,
  branches: (id: string) => ["merchant", id, "branches"] as const,
  members: (id: string) => ["merchant", id, "members"] as const,
  pos: (id: string) => ["merchant", id, "pos"] as const,
  webhooks: (id: string) => ["merchant", id, "webhooks"] as const,
  deliveries: (id: string, webhookId: string) => ["merchant", id, "webhooks", webhookId] as const,
};

export function useBranches(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.branches(merchantId),
    queryFn: () => merchantCabinetApi(api).branches(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useCreateBranch(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => merchantCabinetApi(api).createBranch(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.branches(merchantId) }),
  });
}

export function useMembers(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.members(merchantId),
    queryFn: () => merchantCabinetApi(api).members(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useAddMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddMemberInput) => merchantCabinetApi(api).addMember(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

/** Партнёру выбирают одну операцию навсегда, поэтому ручка отдельная. */
export function useAddPartner(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddPartnerInput) => merchantCabinetApi(api).addPartner(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

export function useRemoveMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => merchantCabinetApi(api).removeMember(merchantId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

export function usePosSettings(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.pos(merchantId),
    queryFn: () => merchantCabinetApi(api).posSettings(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useUpdatePosSettings(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, body }: { programId: string; body: Record<string, unknown> }) =>
      merchantCabinetApi(api).updatePosSettings(merchantId, programId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.pos(merchantId) }),
  });
}

/** Сбрасывает настройки кассы к значениям по умолчанию. */
export function useResetPosSettings(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (programId: string) => merchantCabinetApi(api).resetPosSettings(merchantId, programId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.pos(merchantId) }),
  });
}

export function useWebhooks(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.webhooks(merchantId),
    queryFn: () => merchantCabinetApi(api).webhooks(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useCreateWebhook(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWebhookInput) => merchantCabinetApi(api).createWebhook(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.webhooks(merchantId) }),
  });
}

export function useWebhookDeliveries(merchantId: string, webhookId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.deliveries(merchantId, webhookId ?? ""),
    queryFn: () => merchantCabinetApi(api).webhookDeliveries(merchantId, webhookId!),
    enabled: Boolean(merchantId && webhookId),
  });
}

export function useMerchant(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.detail(merchantId),
    queryFn: () => merchantsApi(api).get(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** isActive — главное поле: пока false, заведение не может принимать бонусы. */
export function useSubscription(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.subscription(merchantId),
    queryFn: () => merchantCabinetApi(api).subscription(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useDeductions(merchantId: string, query: DeductionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.deductions(merchantId, query),
    queryFn: () => merchantCabinetApi(api).deductions(merchantId, query),
    enabled: Boolean(merchantId),
    placeholderData: (previous) => previous,
  });
}

export function useInvoices(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.invoices(merchantId),
    queryFn: () => merchantCabinetApi(api).invoices(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useCreateInvoice(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => merchantCabinetApi(api).createInvoice(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.invoices(merchantId) }),
  });
}

export function useOnecIntegration(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.onec(merchantId),
    queryFn: () => merchantCabinetApi(api).onecIntegration(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** Перевыпуск токена немедленно ломает прежний адрес вебхука в 1С. */
export function useRegenerateOnecToken(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantCabinetApi(api).regenerateOnecToken(merchantId),
    onSuccess: (data) => queryClient.setQueryData(merchantKeys.onec(merchantId), data),
  });
}

/** Подтвердить приглашённого: до этого он в списке, но доступа не имеет. */
export function useAcceptMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => merchantCabinetApi(api).acceptMember(merchantId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

/** Точка, с которой человек сканирует: по ней в «Продажах» видно, где прошла операция. */
export function useUpdateMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, branchId }: { memberId: string; branchId: string | null }) =>
      merchantCabinetApi(api).updateMember(merchantId, memberId, { branchId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

/** Приветственный бонус партнёра: обе величины вместе, null очищает. */
export function useUpdatePartnerBonus(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      amount,
      maxPerCustomer,
    }: {
      memberId: string;
      amount: number | null;
      maxPerCustomer: number | null;
    }) => merchantCabinetApi(api).updatePartnerBonus(merchantId, memberId, { amount, maxPerCustomer }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

/**
 * Списание бонусов за покупку. merchantId шлём, только если человек работает в
 * нескольких заведениях: с одним местом работы сервер определяет его сам и
 * лишнее поле отклоняет.
 */
export function useRedeem() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ input, maxPercent }: { input: RedemptionForm & { merchantId?: string }; maxPercent: number }) =>
      redemptionsApi(api).redeem(input, maxPercent),
  });
}
