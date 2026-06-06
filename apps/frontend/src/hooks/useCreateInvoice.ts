import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateInvoiceInput, IInvoice } from "@invoice/shared";
import { api } from "@/lib/api";

/** Create an invoice, then refresh the list + summary so new data appears. */
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      api.post<IInvoice>("/invoices", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
