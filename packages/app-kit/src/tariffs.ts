import { tariffsApi } from "@loal/api";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "./session";

/** Open cabinets must notice the end of the free offer without a page reload. */
export function usePublicTariffs() {
  const api = useApi();
  return useQuery({
    queryKey: ["public-tariffs"],
    queryFn: () => tariffsApi(api).publicList(),
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });
}
