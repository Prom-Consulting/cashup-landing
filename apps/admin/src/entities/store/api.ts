import { storesApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Запросы про магазины. Ключи кэша перечислены здесь же, чтобы не разъезжались. */
export const storeKeys = {
  all: ["stores"] as const,
  detail: (id: string) => ["stores", id] as const,
  members: (id: string) => ["stores", id, "members"] as const,
  invites: (id: string) => ["stores", id, "invites"] as const,
};

export function useStores() {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.all, queryFn: () => storesApi(api).list() });
}

export function useStore(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.detail(storeId), queryFn: () => storesApi(api).get(storeId) });
}

export function useStoreMembers(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.members(storeId), queryFn: () => storesApi(api).members(storeId) });
}

export function useStoreInvites(storeId: string) {
  const api = useApi();
  return useQuery({ queryKey: storeKeys.invites(storeId), queryFn: () => storesApi(api).invites(storeId) });
}

export function useCreateInvite(storeId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => storesApi(api).createInvite(storeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeKeys.invites(storeId) }),
  });
}
