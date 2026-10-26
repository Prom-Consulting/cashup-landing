import { notificationsApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Центр уведомлений заведения (владелец и администратор филиала). */
export const notificationKeys = {
  inbox: (merchantId: string) => ["merchant", merchantId, "notifications"] as const,
};

// Ответы агентства и награды приходят без нашего участия — перечитываем, пока кабинет открыт.
const POLL_MS = 60_000;

export function useNotifications(merchantId: string) {
  const api = useApi();
  return useQuery({
    queryKey: notificationKeys.inbox(merchantId),
    queryFn: () => notificationsApi(api).inbox(merchantId),
    enabled: Boolean(merchantId),
    refetchInterval: POLL_MS,
  });
}

export function useMarkNotificationsRead(merchantId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => notificationsApi(api).markRead(merchantId, ids),
    onSuccess: (data) => queryClient.setQueryData(notificationKeys.inbox(merchantId), data),
  });
}
