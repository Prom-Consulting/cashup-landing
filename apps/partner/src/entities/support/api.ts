import { supportApi, type SupportReplyInput, type SupportTicketInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Вопросы заведения агентству (владелец — все ветки, администратор филиала — свои). */
export const supportKeys = {
  all: (merchantId: string) => ["merchant", merchantId, "support"] as const,
  list: (merchantId: string) => ["merchant", merchantId, "support", "list"] as const,
  thread: (merchantId: string, ticketId: string) => ["merchant", merchantId, "support", "thread", ticketId] as const,
};

// Ответ агентства приходит без нашего участия — список перечитываем сами, пока кабинет открыт
const POLL_MS = 30_000;

export function useSupportTickets(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: supportKeys.list(merchantId),
    queryFn: () => supportApi(api).list(merchantId),
    enabled: Boolean(merchantId),
    refetchInterval: POLL_MS,
  });
}

/** Открыть ветку — значит прочитать ответы, поэтому после загрузки перечитываем и список. */
export function useSupportThread(merchantId: string, ticketId: string | undefined) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: supportKeys.thread(merchantId, ticketId ?? ""),
    queryFn: async () => {
      const thread = await supportApi(api).thread(merchantId, ticketId!);
      void queryClient.invalidateQueries({ queryKey: supportKeys.list(merchantId) });
      return thread;
    },
    enabled: Boolean(merchantId && ticketId),
    refetchInterval: POLL_MS,
  });
}

function useThreadUpdate(merchantId: string) {
  const queryClient = useQueryClient();
  return (thread: { ticket: { id: string } }) => {
    queryClient.setQueryData(supportKeys.thread(merchantId, thread.ticket.id), thread);
    void queryClient.invalidateQueries({ queryKey: supportKeys.list(merchantId) });
  };
}

export function useCreateSupportTicket(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SupportTicketInput) => supportApi(api).create(merchantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supportKeys.list(merchantId) }),
  });
}

export function useReplySupport(merchantId: string, ticketId: string) {
  const api = useApi();
  const update = useThreadUpdate(merchantId);
  return useMutation({
    mutationFn: (input: SupportReplyInput) => supportApi(api).reply(merchantId, ticketId, input),
    onSuccess: update,
  });
}

export function useCloseSupportTicket(merchantId: string, ticketId: string) {
  const api = useApi();
  const update = useThreadUpdate(merchantId);
  return useMutation({
    mutationFn: () => supportApi(api).close(merchantId, ticketId),
    onSuccess: update,
  });
}
