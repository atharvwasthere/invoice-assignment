import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { IInvoice, SortableField } from "@invoice/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInvoices } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Pagination } from "@/components/invoices/Pagination";

// The create/edit modal pulls in radix-dialog + react-hook-form + zod — only loaded
// the first time the user actually opens it.
const InvoiceFormModal = lazy(() =>
  import("@/components/invoices/InvoiceFormModal").then((m) => ({
    default: m.InvoiceFormModal,
  })),
);

export function InvoiceListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: customers = [] } = useCustomers();

  const params = useMemo(
    () => Object.fromEntries(searchParams),
    [searchParams],
  );
  const { data, isLoading, isError, refetch } = useInvoices(params);

  const sortBy = searchParams.get("sortBy") ?? "dueDate";
  const order = searchParams.get("order") ?? "desc";

  // Modal: invoice null means "create", an object means "edit that invoice".
  // We pass the row's invoice straight in (it's already loaded) — no refetch.
  const [modal, setModal] = useState<{ open: boolean; invoice: IInvoice | null }>({
    open: false,
    invoice: null,
  });

  /** Set/clear a single URL param; any filter/sort change resets back to page 1. */
  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  /** Set/clear several params in one update (used by the date-range filter). */
  const setParams = useCallback(
    (updates: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const handleSort = useCallback(
    (field: SortableField) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const curField = prev.get("sortBy") ?? "dueDate";
        const curOrder = prev.get("order") ?? "desc";
        if (curField === field) {
          next.set("order", curOrder === "asc" ? "desc" : "asc");
        } else {
          next.set("sortBy", field);
          next.set("order", "asc");
        }
        next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const handleEdit = useCallback(
    (id: string) => {
      const inv = data?.data.find((i) => i._id === id) ?? null;
      setModal({ open: true, invoice: inv });
    },
    [data],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Invoices</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/summary">Summary</Link>
          </Button>
          <Button onClick={() => setModal({ open: true, invoice: null })}>
            New invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <InvoiceFilters
          values={params}
          onChange={setParam}
          onChangeMany={setParams}
          customers={customers}
        />
        <InvoiceTable
          invoices={data?.data ?? []}
          sortBy={sortBy}
          order={order}
          onSort={handleSort}
          onEdit={handleEdit}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
        />
        <Pagination
          page={data?.page ?? 1}
          limit={data?.limit ?? 20}
          total={data?.total ?? 0}
          onPage={(p) => setParam("page", String(p))}
        />
      </CardContent>

      {modal.open && (
        <Suspense fallback={null}>
          <InvoiceFormModal
            open={modal.open}
            invoice={modal.invoice}
            customers={customers}
            onClose={() => setModal({ open: false, invoice: null })}
          />
        </Suspense>
      )}
    </Card>
  );
}
