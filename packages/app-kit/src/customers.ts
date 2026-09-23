import { platformApi, type CreateCustomerInput, type CustomerQuery, type IssueCardInput } from "@loal/api";
import { useApi } from "./session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Клиенты и карты принадлежат платформе: заведения к ним доступа не имеют (403).
 * Поэтому здесь нет merchantId — только агентство.
 */
export const customerKeys = {
  all: ["customers"] as const,
  table: (query: CustomerQuery) => ["customers", query] as const,
  cards: (customerId: string) => ["customers", customerId, "cards"] as const,
  catalog: ["catalog"] as const,
};

export function useCustomers(query: CustomerQuery) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.table(query),
    queryFn: () => platformApi(api).customers(query),
    placeholderData: (previous) => previous,
  });
}

export function useCustomerCards(customerId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.cards(customerId ?? ""),
    queryFn: () => platformApi(api).customerCards(customerId!),
    enabled: Boolean(customerId),
  });
}

/** Шаблоны карт и программы нужны вместе: без пары выпускать нечего. */
export function useIssueCatalog(enabled: boolean) {
  const api = useApi();
  return useQuery({
    queryKey: customerKeys.catalog,
    queryFn: async () => {
      const [templates, programs] = await Promise.all([platformApi(api).templates(), platformApi(api).programs()]);
      return { templates, programs };
    },
    enabled,
  });
}

export function useCreateCustomer() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => platformApi(api).createCustomer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useIssueCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueCardInput) => platformApi(api).issueCard(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}

export function useRevokeCard() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (serial: string) => platformApi(api).revokeCard(serial),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
