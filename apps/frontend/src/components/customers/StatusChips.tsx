import type { InvoiceStatus, StatusCounts } from "@invoice/shared";
import { Badge } from "@/components/ui/badge";
import { STATUS_CLASS } from "@/lib/statusStyles";

/** Per-status count chips, rendered for whichever statuses the customer actually has. */
export function StatusChips({ counts }: { counts: StatusCounts }) {
  const entries = Object.entries(counts) as [InvoiceStatus, number][];
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([status, n]) => (
        <Badge key={status} variant="secondary" className={STATUS_CLASS[status]}>
          {status} {n}
        </Badge>
      ))}
    </div>
  );
}
