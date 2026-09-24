import {
  merchantCabinetApi,
  merchantsApi,
  type AddMemberInput,
  type AddPartnerInput,
  type CreateBranchInput,
  type CreateInvoiceInput,
  type CreateWebhookInput,
  type DeductionQuery,
  type MerchantProfile,
} from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const merchantKeys = {
  detail: (id: string) => ["merchant", id] as const,
  subscription: (id: string) => ["merchant", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchant", id, "deductions", query] as const,
  invoices: (id: string) => ["merchant", id, "invoices"] as const,
  onec: (id: string) => ["merchant", id, "onec"] as const,
  profile: (id: string) => ["merchant", id, "profile"] as const,
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

export function useProfile(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.profile(merchantId),
    queryFn: () => merchantCabinetApi(api).profile(merchantId),
    enabled: Boolean(merchantId),
  });
}

/** PUT заменяет профиль целиком — отправляем все шесть полей. */
export function useSaveProfile(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: MerchantProfile) => merchantCabinetApi(api).saveProfile(merchantId, profile),
    onSuccess: (saved) => queryClient.setQueryData(merchantKeys.profile(merchantId), saved),
  });
}

export function useUploadAsset(merchantId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: ({ slot, file }: { slot: "merchantLogo" | "merchantPhoto"; file: File }) =>
      merchantCabinetApi(api).uploadAsset(merchantId, slot, file),
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
