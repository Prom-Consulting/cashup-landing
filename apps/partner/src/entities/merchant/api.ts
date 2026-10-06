import {
  type CheckoutPointInput,
  ApiError,
  merchantCabinetApi,
  merchantExitApi,
  type ExitRequestInput,
  merchantsApi,
  promoApi,
  tariffOf,
  type ConnectOctopayInput,
  type CreateBranchInput,
  type CreateInvoiceInput,
  type CreateWebhookInput,
  type DeductionQuery,
  type RedeemPromoInput,
} from "@loal/api";
import { refetchWhilePending, useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const merchantKeys = {
  detail: (id: string) => ["merchant", id] as const,
  subscription: (id: string) => ["merchant", id, "subscription"] as const,
  octopay: (id: string) => ["merchant", id, "octopay"] as const,
  deductions: (id: string, query: DeductionQuery) => ["merchant", id, "deductions", query] as const,
  invoices: (id: string) => ["merchant", id, "invoices"] as const,
  onec: (id: string) => ["merchant", id, "onec"] as const,
  branches: (id: string, archived = false) => ["merchant", id, "branches", archived] as const,
  members: (id: string) => ["merchant", id, "members"] as const,
  pos: (id: string) => ["merchant", id, "pos"] as const,
  webhooks: (id: string) => ["merchant", id, "webhooks"] as const,
  deliveries: (id: string, webhookId: string) => ["merchant", id, "webhooks", webhookId] as const,
  checkoutPoints: (id: string) => ["merchant", id, "checkout-points"] as const,
  exitRequest: (id: string) => ["merchant", id, "exit-request"] as const,
};

/** Открытые филиалы; includeArchived — вместе с закрытыми, чтобы журнал назвал прошлую точку. */
export function useBranches(merchantId: string, includeArchived = false) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.branches(merchantId, includeArchived),
    queryFn: () => merchantCabinetApi(api).branches(merchantId, includeArchived),
    enabled: Boolean(merchantId),
  });
}

export function useCreateBranch(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => merchantCabinetApi(api).createBranch(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", merchantId, "branches"] }),
  });
}

export function useRenameBranch(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, name }: { branchId: string; name: string }) =>
      merchantCabinetApi(api).renameBranch(merchantId, branchId, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", merchantId, "branches"] }),
  });
}

/** Закрыть филиал (archivedAt). Пока в нём люди — 409 BRANCH_HAS_MEMBERS. */
export function useArchiveBranch(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) => merchantCabinetApi(api).archiveBranch(merchantId, branchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", merchantId, "branches"] }),
  });
}

export function useMembers(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.members(merchantId),
    queryFn: () => merchantCabinetApi(api).members(merchantId),
    enabled: Boolean(merchantId),
    refetchInterval: refetchWhilePending,
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

/**
 * isActive — главное поле: пока false, заведение не может принимать бонусы. null — подписки
 * нет вовсе (магазин на «Только Loal» ещё ни разу не платил): это состояние, а не ошибка.
 */
export function useSubscription(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.subscription(merchantId),
    queryFn: async () => {
      try {
        return await merchantCabinetApi(api).subscription(merchantId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(merchantId),
  });
}

/** Тариф магазина: OctōPAY + Loal или только Loal — по связи с OctōPAY (tariffOf). */
export function useTariff(merchantId: string) {
  const merchant = useMerchant(merchantId);
  return { tariff: tariffOf(merchant.data?.tariff), isPending: merchant.isPending };
}

/** Связь с OctōPAY меняет тариф: перечитываем магазин и подписку. */
function refreshTariff(queryClient: ReturnType<typeof useQueryClient>, merchantId: string) {
  void queryClient.invalidateQueries({ queryKey: merchantKeys.detail(merchantId), exact: true });
  void queryClient.invalidateQueries({ queryKey: merchantKeys.subscription(merchantId), exact: true });
}

export function useOctopayIntegration(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.octopay(merchantId),
    queryFn: () => merchantCabinetApi(api).octopayIntegration(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useConnectOctopay(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    gcTime: 0,
    mutationFn: (input: ConnectOctopayInput) => merchantCabinetApi(api).connectOctopay(merchantId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(merchantKeys.octopay(merchantId), data);
      refreshTariff(queryClient, merchantId);
    },
  });
}

export function useDisconnectOctopay(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => merchantCabinetApi(api).disconnectOctopay(merchantId),
    onSuccess: () => {
      refreshTariff(queryClient, merchantId);
      queryClient.setQueryData(merchantKeys.octopay(merchantId), {
        connected: false,
        isEnabled: false,
        invoiceReady: false,
        invoiceNotReadyReason: "LOAL_LINK_NOT_FOUND",
        activeKgsBankAccountCount: 0,
        payableKgsBankAccountCount: 0,
        ready: false,
        octopayBusinessName: null,
        connectedAt: null,
      });
    },
  });
}

/** Промокод на месяцы подписки магазина: после успеха перечитываем подписку — у неё новый срок. */
export function useRedeemMerchantPromo(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RedeemPromoInput) => promoApi(api).redeemForMerchant(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.subscription(merchantId) }),
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

/**
 * Филиалы человека — весь список целиком. Операции на кассе записываются на выбранный из них,
 * поэтому в «Продажах» видно, где прошла каждая. Права меняются со следующего входа человека.
 */
export function useUpdateMember(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, branchIds }: { memberId: string; branchIds: string[] }) =>
      merchantCabinetApi(api).updateMember(merchantId, memberId, { branchIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.members(merchantId) }),
  });
}

/**
 * Списание бонусов за покупку. merchantId шлём, только если человек работает в
 * нескольких заведениях: с одним местом работы сервер определяет его сам и
 * лишнее поле отклоняет.
 */

/** NFC/QR-кассы самостоятельной оплаты. Видит и меняет только владелец. */
export function useCheckoutPoints(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.checkoutPoints(merchantId),
    queryFn: () => merchantCabinetApi(api).checkoutPoints(merchantId),
    enabled: Boolean(merchantId),
  });
}

export function useCreateCheckoutPoint(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutPointInput) => merchantCabinetApi(api).createCheckoutPoint(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.checkoutPoints(merchantId) }),
  });
}

export function useSetCheckoutPointActive(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pointId, isActive }: { pointId: string; isActive: boolean }) =>
      merchantCabinetApi(api).setCheckoutPointActive(merchantId, pointId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: merchantKeys.checkoutPoints(merchantId) }),
  });
}

// ── Выход из программы ───────────────────────────────────────────────────────

/** Последняя заявка на выход или null. Только владельцу — остальным сервер ответит 403. */
export function useExitRequest(merchantId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: merchantKeys.exitRequest(merchantId),
    queryFn: () => merchantExitApi(api).current(merchantId),
    enabled: Boolean(merchantId) && enabled,
  });
}

export function useRequestExit(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExitRequestInput) => merchantExitApi(api).request(merchantId, input),
    onSuccess: (saved) => queryClient.setQueryData(merchantKeys.exitRequest(merchantId), saved),
  });
}
