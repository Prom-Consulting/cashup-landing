import { leadsApi, type Lead, type LeadStatus } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const leadKeys = { all: ["leads"] as const };

export function useLeads() {
  const api = useApi();
  return useQuery({ queryKey: leadKeys.all, queryFn: () => leadsApi(api).list() });
}

/** Смена статуса заявки. Обновляем список сразу, не дожидаясь перезапроса. */
export function useUpdateLeadStatus() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => leadsApi(api).updateStatus(id, status),
    onSuccess: (lead) => {
      queryClient.setQueryData<Lead[]>(leadKeys.all, (rows) => rows?.map((row) => (row.id === lead.id ? lead : row)));
    },
  });
}
