import { partnersApi, type CreateEmployeeInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const partnerKeys = {
  me: (memberId: string) => ["partner", memberId] as const,
  employees: (memberId: string) => ["partner", memberId, "employees"] as const,
  payments: (memberId: string, page: number) => ["partner", memberId, "payments", page] as const,
};

export function usePartner(memberId: string) {
  const api = useApi();
  return useQuery({ queryKey: partnerKeys.me(memberId), queryFn: () => partnersApi(api).me(memberId) });
}

export function useEmployees(memberId: string) {
  const api = useApi();
  return useQuery({ queryKey: partnerKeys.employees(memberId), queryFn: () => partnersApi(api).employees(memberId) });
}

export function useAddEmployee(memberId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => partnersApi(api).addEmployee(memberId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: partnerKeys.employees(memberId) }),
  });
}

export function usePayments(memberId: string, page: number) {
  const api = useApi();
  return useQuery({
    queryKey: partnerKeys.payments(memberId, page),
    queryFn: () => partnersApi(api).payments(memberId, { page, pageSize: 20 }),
    placeholderData: (previous) => previous,
  });
}
