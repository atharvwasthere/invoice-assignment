import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { IInvoice, SortableField } from "@invoice/shared";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { InvoiceRow } from "./InvoiceRow";

interface Props {
  invoices: IInvoice[];
  sortBy: string;
  order: string;
  onSort: (field: SortableField) => void;
  onEdit: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function InvoiceTable({
  invoices,
  sortBy,
  order,
  onSort,
  onEdit,
  isLoading,
  isError,
  onRetry,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <SortHeader
              label="Amount"
              field="amount"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
              align="right"
            />
            <TableHead className="text-right">Tax%</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Issued</TableHead>
            <SortHeader
              label="Due"
              field="dueDate"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
            />
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <SkeletonRows />
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={8} className="p-4">
                <ErrorState
                  message="Couldn't load invoices."
                  onRetry={onRetry}
                />
              </TableCell>
            </TableRow>
          ) : invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No invoices match these filters.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <InvoiceRow key={inv._id} invoice={inv} onEdit={onEdit} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface SortHeaderProps {
  label: string;
  field: SortableField;
  sortBy: string;
  order: string;
  onSort: (field: SortableField) => void;
  align?: "right";
}

/** Clickable column header that toggles sort direction for a sortable field. */
function SortHeader({ label, field, sortBy, order, onSort, align }: SortHeaderProps) {
  const active = sortBy === field;
  const Icon = !active ? ChevronsUpDown : order === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {label}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
