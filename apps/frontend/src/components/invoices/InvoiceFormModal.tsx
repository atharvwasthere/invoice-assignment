import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createInvoiceSchema,
  INVOICE_STATUSES,
  TAX_RATES,
  type CreateInvoiceInput,
  type ICustomer,
  type IInvoice,
} from "@invoice/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCreateInvoice } from "@/hooks/useCreateInvoice";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { formatINR } from "@/lib/format";

/**
 * Form schema DERIVED from the shared `createInvoiceSchema` (single source of truth for
 * the field set, customer, and status enum). We only adapt the fields that arrive from
 * form inputs as strings: amount/taxRate are coerced to numbers, and dates are kept as
 * "yyyy-mm-dd" strings (the backend's createInvoiceSchema coerces them to Date on submit).
 */
const invoiceFormSchema = createInvoiceSchema.extend({
  // Plain numbers (not z.coerce) so the form's input type equals its output type —
  // the fields convert string→number themselves (valueAsNumber / Number()).
  amount: z.number().nonnegative("Amount must be ≥ 0"),
  taxRate: z
    .number()
    .refine((n) => (TAX_RATES as readonly number[]).includes(n), "Invalid tax rate"),
  issueDate: z.string().min(1, "Required"),
  dueDate: z.string().min(1, "Required"),
});
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

interface Props {
  open: boolean;
  invoice: IInvoice | null; // null = create, object = edit (already loaded from the list)
  customers: ICustomer[];
  onClose: () => void;
}

export function InvoiceFormModal({ open, invoice, customers, onClose }: Props) {
  const isEdit = invoice !== null;
  const createMut = useCreateInvoice();
  const updateMut = useUpdateInvoice();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      customer: "",
      amount: undefined,
      taxRate: 0,
      status: "Draft",
      issueDate: "",
      dueDate: "",
    },
  });

  // Prefill on open from the invoice already in hand (edit) or a clean slate (create).
  // No fetch — the invoice came down with the list query, so the form fills instantly.
  useEffect(() => {
    if (!open) return;
    if (invoice) {
      const customerId =
        typeof invoice.customer === "object"
          ? invoice.customer._id
          : invoice.customer;
      form.reset({
        customer: customerId,
        amount: invoice.amount,
        taxRate: invoice.taxRate,
        status: invoice.status,
        issueDate: invoice.issueDate.slice(0, 10),
        dueDate: invoice.dueDate.slice(0, 10),
      });
    } else {
      form.reset({
        customer: "",
        amount: undefined,
        taxRate: 0,
        status: "Draft",
        issueDate: "",
        dueDate: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice]);

  // Company is derived from the selected customer — display only, never submitted
  // (the invoice stores a customer ref, not the company name).
  const selectedCustomer = customers.find((c) => c._id === form.watch("customer"));
  const amount = Number(form.watch("amount")) || 0;
  const taxRate = Number(form.watch("taxRate")) || 0;
  const tax = round2((amount * taxRate) / 100);
  const total = round2(amount + tax);

  const onSubmit = (values: InvoiceFormValues) => {
    // Dates go over the wire as ISO strings; the backend validates/coerces them with
    // the same shared schema, so this boundary cast is safe.
    const payload = values as unknown as CreateInvoiceInput;
    if (invoice) {
      updateMut.mutate(
        { id: invoice._id, input: payload },
        {
          onSuccess: () => {
            toast.success("Invoice updated");
            onClose();
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success("Invoice created");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the invoice details. Tax and total are recomputed automatically."
              : "Create an invoice. The invoice number is assigned automatically."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label className="text-muted-foreground">Company (auto-filled)</Label>
              <Input value={selectedCustomer?.company ?? ""} readOnly disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax rate</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="0/3/5/18/28" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TAX_RATES.map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INVOICE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md bg-muted p-3 text-sm">
              Tax <span className="font-medium">{formatINR(tax)}</span> · Total{" "}
              <span className="font-medium">{formatINR(total)}</span>{" "}
              <span className="text-muted-foreground">(computed)</span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save invoice"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
