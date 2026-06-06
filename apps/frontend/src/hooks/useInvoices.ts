import { useQuery } from "@tanstack/react-query";
import type { IInvoice, PaginatedResult } from "@invoice/shared";
import { api } from "@/lib/api";

/**
 * Paginated/filtered/sorted invoice list. `params` is the raw query-string record
 * (driven by the URL search params), so the query key changes whenever any filter,
 * sort, or page changes — React Query then caches per-combination and refetches
 * race-safely.
 */
export function useInvoices(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: () => api.get<PaginatedResult<IInvoice>>(`/invoices?${qs}`),
    placeholderData: (prev) => prev, // keep previous page visible while the next loads
  });
}
