import { merchantExitApi, type ExitRequestStatus, type RejectExitInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Заявки партнёров на выход из программы — решает агентство. */
export const exitKeys = {
  all: ["merchant-exit-requests"] as const,
  list: (status: ExitRequestStatus | "all") => ["merchant-exit-requests", status] as const,
};

export function useExitRequests(status: ExitRequestStatus | "all") {
  const api = useApi();
  return useQuery({
    queryKey: exitKeys.list(status),
    queryFn: () => merchantExitApi(api).list(status === "all" ? undefined : status),
    placeholderData: (previous) => previous,
  });
}

/** Подтверждение удаляет магазин — перечитываем и заявки, и список заведений. */
export function useApproveExit() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => merchantExitApi(api).approve(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: exitKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["merchants"] });
    },
  });
}

export function useRejectExit() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RejectExitInput }) => merchantExitApi(api).reject(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exitKeys.all }),
  });
}
