import { useQuery } from "@tanstack/react-query";
import type { GlobalSummary } from "@invoice/shared";
import { api } from "@/lib/api";

/** Global dashboard rollup: totals, counts, and top-5 customers by value. */
export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => api.get<GlobalSummary>("/summary"),
  });
}
