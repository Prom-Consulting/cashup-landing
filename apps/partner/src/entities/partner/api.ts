import {
  partnerCashiersApi,
  partnerSelfApi,
  type AddEmployeeInput,
  type CreateCashierInput,
  type PartnerInvoiceInput,
  type PartnerPaymentQuery,
} from "@loal/api";
import { refetchWhilePending, useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Партнёрский раздел: ключ ко всему — запись самого партнёра (memberId), а не заведение. */
export const partnerKeys = {
  me: (memberId: string) => ["partner", memberId] as const,
  cashiers: (memberId: string) => ["partner", memberId, "cashiers"] as const,
  employees: (memberId: string) => ["partner", memberId, "employees"] as const,
  payments: (memberId: string, query: PartnerPaymentQuery) => ["partner", memberId, "payments", query] as const,
};

export function usePartnerMe(memberId: string) {
  const api = useApi();
  return useQuery({
    queryKey: partnerKeys.me(memberId),
    queryFn: () => partnerSelfApi(api).me(memberId),
    enabled: Boolean(memberId),
  });
}

export function usePartnerPayments(memberId: string, query: PartnerPaymentQuery) {
  const api = useApi();
  return useQuery({
    queryKey: partnerKeys.payments(memberId, query),
    queryFn: () => partnerSelfApi(api).payments(memberId, query),
    enabled: Boolean(memberId),
    placeholderData: (previous) => previous,
  });
}

/** Счёт клиенту: оплатит — бонусы спишутся с его карты сами. */
export function useInvoiceClient(memberId: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (input: PartnerInvoiceInput) => partnerSelfApi(api).invoiceClient(memberId, input),
  });
}

export function usePayPartnerAccess(memberId: string) {
  const api = useApi();
  return useMutation({ mutationFn: (months: number) => partnerSelfApi(api).payAccess(memberId, months) });
}

/** Кассиры филиала партнёра: список, новый по имени и телефону, удаление. */
export function useCashiers(memberId: string) {
  const api = useApi();
  return useQuery({
    queryKey: partnerKeys.cashiers(memberId),
    queryFn: () => partnerCashiersApi(api).list(memberId),
    enabled: Boolean(memberId),
    // Пока кто-то ещё не вошёл, изредка перечитываем — чтобы заметить, что он зарегистрировался
    refetchInterval: refetchWhilePending,
  });
}

export function useCreateCashier(memberId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCashierInput) => partnerCashiersApi(api).create(memberId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partnerKeys.cashiers(memberId) }),
  });
}

export function useRemoveCashier(memberId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cashierId: string) => partnerCashiersApi(api).remove(memberId, cashierId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partnerKeys.cashiers(memberId) }),
  });
}

/** Сотрудники партнёра — со сканером и его единственной операцией. Заводятся по телефону. */
export function usePartnerEmployees(memberId: string) {
  const api = useApi();
  return useQuery({
    queryKey: partnerKeys.employees(memberId),
    queryFn: () => partnerSelfApi(api).employees(memberId),
    enabled: Boolean(memberId),
    refetchInterval: refetchWhilePending,
  });
}

export function useAddEmployee(memberId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddEmployeeInput) => partnerSelfApi(api).addEmployee(memberId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partnerKeys.employees(memberId) }),
  });
}
