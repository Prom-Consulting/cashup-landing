import { agencySupportApi, type SupportReplyInput, type SupportStatus } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Вопросы заведений агентству. */
export const supportKeys = {
  all: ["support"] as const,
  list: (status: SupportStatus | "all") => ["support", "list", status] as const,
  thread: (id: string) => ["support", "thread", id] as const,
};

// Новый вопрос приходит сам — входящие перечитываем, пока админка открыта
const POLL_MS = 30_000;

export function useSupportTickets(status: SupportStatus | "all") {
  const api = useApi();
  return useQuery({
    queryKey: supportKeys.list(status),
    queryFn: () => agencySupportApi(api).list(status === "all" ? undefined : status),
    placeholderData: (previous) => previous,
    refetchInterval: POLL_MS,
  });
}

/** Открыть вопрос — значит прочитать его: после загрузки перечитываем и входящие. */
export function useSupportThread(id: string | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: supportKeys.thread(id ?? ""),
    queryFn: async () => {
      const thread = await agencySupportApi(api).thread(id!);
      void queryClient.invalidateQueries({ queryKey: ["support", "list"] });
      return thread;
    },
    enabled: Boolean(id),
    refetchInterval: POLL_MS,
  });
}

function useThreadUpdate() {
  const queryClient = useQueryClient();
  return (thread: { ticket: { id: string } }) => {
    queryClient.setQueryData(supportKeys.thread(thread.ticket.id), thread);
    void queryClient.invalidateQueries({ queryKey: ["support", "list"] });
  };
}

export function useReplySupport(id: string) {
  const api = useApi();
  const update = useThreadUpdate();
  return useMutation({
    mutationFn: (input: SupportReplyInput) => agencySupportApi(api).reply(id, input),
    onSuccess: update,
  });
}

export function useCloseSupportTicket(id: string) {
  const api = useApi();
  const update = useThreadUpdate();
  return useMutation({ mutationFn: () => agencySupportApi(api).close(id), onSuccess: update });
}
