import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IInvoice, UpdateInvoiceInput } from "@invoice/shared";
import { api } from "@/lib/api";

/** Edit an invoice (PATCH partial), then refresh list, summary, and the single cache. */
export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateInvoiceInput }) =>
      api.patch<IInvoice>(`/invoices/${id}`, input),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["invoice", updated._id] });
      qc.invalidateQueries({ queryKey: ["customer"] });
    },
  });
}
