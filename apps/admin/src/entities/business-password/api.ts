import { businessPasswordsApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const businessPasswordKeys = { list: ["business-passwords"] as const };

/** Владельцы и администраторы филиалов работающих заведений — и есть ли у них пароль. */
export function useBusinessPasswords() {
  const api = useApi();
  return useQuery({ queryKey: businessPasswordKeys.list, queryFn: () => businessPasswordsApi(api).list() });
}

/** Один человек — одно сообщение в WhatsApp с новым временным паролем. */
export function useSendBusinessPassword() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, replaceOwn }: { userId: string; replaceOwn?: boolean }) =>
      businessPasswordsApi(api).send(userId, replaceOwn),
    onSuccess: (result) =>
      queryClient.setQueryData(businessPasswordKeys.list, (previous: ReturnType<typeof useBusinessPasswords>["data"]) => {
        if (!previous) return previous;
        const items = previous.items.map((item) => (item.userId === result.item.userId ? result.item : item));
        const summary = { ...previous.summary, none: 0, temporary: 0, set: 0 };
        for (const item of items) summary[item.password] += 1;
        return { ...previous, items, summary };
      }),
  });
}
