import { customersApi, type CreateCustomerInput, type CustomerQuery, type IssueCardInput } from "@loal/api";
import { useApi } from "./session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const customerKeys = {
  table: (storeId: string, query: CustomerQuery) => ["customers", storeId, query] as const,
  cards: (storeId: string, customerId: string) => ["customers", storeId, customerId, "cards"] as const,
  catalog: (storeId: string) => ["catalog", storeId] as const,
};

export function useCustomers(storeId: string, query: CustomerQuery) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.table(storeId, query),
    queryFn: () => customersApi(api).table(storeId, query),
    enabled: Boolean(storeId),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerCards(storeId: string, customerId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.cards(storeId, customerId ?? ""),
    queryFn: () => customersApi(api).cards(storeId, customerId!),
    enabled: Boolean(storeId && customerId),
  });
}

/** Шаблоны карт и программы нужны вместе: без пары выпускать нечего. */
export function useIssueCatalog(storeId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.catalog(storeId),
    queryFn: async () => {
      const [templates, programs] = await Promise.all([
        customersApi(api).templates(storeId),
        customersApi(api).programs(storeId),
      ]);
      return { templates, programs };
    },
    enabled: Boolean(storeId) && enabled,
  });
}

export function useCreateCustomer(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersApi(api).create(storeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
  });
}

export function useIssueCard(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueCardInput) => customersApi(api).issueCard(storeId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
  });
}

export function useRevokeCard(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serial: string) => customersApi(api).revokeCard(storeId, serial),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
  });
}
