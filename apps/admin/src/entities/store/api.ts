import { storeCabinetApi, storesApi, type BuyMonthsInput, type CreateStoreInput, type DeductionQuery, type StoreKind } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Запросы про магазины. Ключи кэша перечислены здесь же, чтобы не разъезжались. */
export const storeKeys = {
  all: ["stores"] as const,
  list: (kind?: StoreKind) => ["stores", { kind }] as const,
  subscription: (id: string) => ["stores", id, "subscription"] as const,
  deductions: (id: string, query: DeductionQuery) => ["stores", id, "deductions", query] as const,
  detail: (id: string) => ["stores", id] as const,
  members: (id: string) => ["stores", id, "members"] as const,
  invites: (id: string) => ["stores", id, "invites"] as const,
};

export function useStores(kind?: StoreKind) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.list(kind), queryFn: () => storesApi(api).list(kind) });
}

/** Создание магазина. После успеха список перечитываем — он же и есть главный экран. */
export function useCreateStore() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStoreInput) => storesApi(api).create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeKeys.all }),
  });
}

export function useSuspendStore(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => storesApi(api).suspend(storeId),
    onSuccess: (store) => {
      queryClient.setQueryData(storeKeys.detail(storeId), store);
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
    },
  });
}

/** Подписка магазина: пока isActive false, приём бонусов не работает. */
export function useStoreSubscription(storeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.subscription(storeId),
    queryFn: () => storeCabinetApi(api).subscription(storeId),
    enabled: Boolean(storeId),
  });
}

/** Выдача доступа без оплаты — то, чем платформа включает магазин вручную. */
export function useGrantSubscription(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BuyMonthsInput) => storeCabinetApi(api).grantSubscription(storeId, input),
    onSuccess: (data) => queryClient.setQueryData(storeKeys.subscription(storeId), data),
  });
}

export function useStoreDeductions(storeId: string, query: DeductionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.deductions(storeId, query),
    queryFn: () => storeCabinetApi(api).deductions(storeId, query),
    enabled: Boolean(storeId),
    placeholderData: (previous) => previous,
  });
}

export function useStore(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.detail(storeId), queryFn: () => storesApi(api).get(storeId) });
}

export function useStoreMembers(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.members(storeId), queryFn: () => storesApi(api).members(storeId) });
}

export function useStoreInvites(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.invites(storeId), queryFn: () => storesApi(api).invites(storeId) });
}

export function useCreateInvite(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => storesApi(api).createInvite(storeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeKeys.invites(storeId) }),
  });
}
