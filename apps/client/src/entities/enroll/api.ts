import { enrollApi, type EnrollInput } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useMutation, useQuery } from "@tanstack/react-query";

/** Что показать на странице выдачи: название карты и подписи дополнительных полей. */
export function useEnrollInfo(templateId?: string) {
  const api = useApi();
  return useQuery({
    queryKey: ["enroll", templateId ?? "default"],
    queryFn: () => enrollApi(api).info(templateId),
    retry: false,
  });
}

/** Карта заводится сразу. Если она у человека уже есть, сервер вернёт её же. */
export function useEnroll() {
  const api = useApi();
  return useMutation({ mutationFn: (input: EnrollInput) => enrollApi(api).enroll(input) });
}
