import { revenueApi } from "@loal/api";
import { useApi } from "@loal/app-kit";
import { useQuery } from "@tanstack/react-query";

export function useRevenue() {
  const api = useApi();
  return useQuery({ queryKey: ["revenue"], queryFn: () => revenueApi(api).report() });
}
