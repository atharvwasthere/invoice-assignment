import { useQuery } from "@tanstack/react-query";
import type { ICustomer } from "@invoice/shared";
import { api } from "@/lib/api";

/** Full customer list for the filter dropdown + create form. Cached long (rarely changes). */
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => api.get<ICustomer[]>("/customers"),
    staleTime: 5 * 60_000,
  });
}
