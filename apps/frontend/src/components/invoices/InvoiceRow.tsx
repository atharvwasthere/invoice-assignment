import { memo } from "react";
import { Link } from "react-router-dom";
import type { IInvoice } from "@invoice/shared";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatDate } from "@/lib/format";
import { STATUS_CLASS } from "@/lib/statusStyles";

interface Props {
  invoice: IInvoice;
  onEdit: (id: string) => void;
}

/**
 * One invoice row. Memoized so re-rendering the list (e.g. on filter change) only
 * re-renders rows whose data actually changed — the #1 perf win for big tables.
 * Requires a stable `onEdit` (the parent passes a useCallback'd handler).
 */
function InvoiceRowBase({ invoice, onEdit }: Props) {
  const customer = typeof invoice.customer === "object" ? invoice.customer : null;

  return (
    <TableRow
      onClick={() => onEdit(invoice._id)}
      className="cursor-pointer"
    >
      <TableCell className="font-medium">{invoice.invoiceId}</TableCell>
      <TableCell>
        {customer ? (
          <Link
            to={`/customers/${customer._id}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            {customer.name}
          </Link>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatINR(invoice.amount)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{invoice.taxRate}%</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatINR(invoice.total)}
      </TableCell>
      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={STATUS_CLASS[invoice.status]}>
          {invoice.status}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export const InvoiceRow = memo(InvoiceRowBase);
