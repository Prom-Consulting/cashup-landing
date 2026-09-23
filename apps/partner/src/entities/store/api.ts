import { storeCabinetApi, storesApi, type CreateInvoiceInput, type DeductionQuery } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const storeKeys = {
  detail: (storeId: string) => ["store", storeId] as const,
  subscription: (storeId: string) => ["store", storeId, "subscription"] as const,
  deductions: (storeId: string, query: DeductionQuery) => ["store", storeId, "deductions", query] as const,
  invoices: (storeId: string) => ["store", storeId, "invoices"] as const,
  onec: (storeId: string) => ["store", storeId, "onec"] as const,
};

export function useStore(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.detail(storeId), queryFn: () => storesApi(api).get(storeId), enabled: Boolean(storeId) });
}

/** isActive — главное поле: пока false, магазин не может принимать бонусы. */
export function useSubscription(storeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.subscription(storeId),
    queryFn: () => storeCabinetApi(api).subscription(storeId),
    enabled: Boolean(storeId),
  });
}

export function useDeductions(storeId: string, query: DeductionQuery) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.deductions(storeId, query),
    queryFn: () => storeCabinetApi(api).deductions(storeId, query),
    enabled: Boolean(storeId),
    placeholderData: (previous) => previous,
  });
}

export function useInvoices(storeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.invoices(storeId),
    queryFn: () => storeCabinetApi(api).invoices(storeId),
    enabled: Boolean(storeId),
  });
}

export function useCreateInvoice(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => storeCabinetApi(api).createInvoice(storeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeKeys.invoices(storeId) }),
  });
}

export function useOnecIntegration(storeId: string) {
  const api = useApi();
  return useQuery({
    queryKey: storeKeys.onec(storeId),
    queryFn: () => storeCabinetApi(api).onecIntegration(storeId),
    enabled: Boolean(storeId),
  });
}

/** Перевыпуск токена немедленно ломает прежний адрес вебхука в 1С. */
export function useRegenerateOnecToken(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => storeCabinetApi(api).regenerateOnecToken(storeId),
    onSuccess: (data) => queryClient.setQueryData(storeKeys.onec(storeId), data),
  });
}
