import { useQuery } from "@tanstack/react-query";
import type { CustomerProfile } from "@invoice/shared";
import { api } from "@/lib/api";

/** Customer profile: company, metrics, status counts, and full invoice history. */
export function useCustomerProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => api.get<CustomerProfile>(`/customers/${id}`),
    enabled: Boolean(id),
  });
}
