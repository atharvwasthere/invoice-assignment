import { Link } from "react-router-dom";
import type { CustomerSummary } from "@invoice/shared";
import { formatINR } from "@/lib/format";

/**
 * Ranked value bars for the top customers — plain divs, no chart library. Each row is a
 * 3-column grid (name · bar · value) so the value sits right where the bar ends, making
 * the name↔value association immediate even on a wide card.
 */
export function TopCustomersBars({ customers }: { customers: CustomerSummary[] }) {
  const max = Math.max(1, ...customers.map((c) => c.totalBilled));
  return (
    <div className="space-y-1">
      {customers.map((c) => (
        <Link
          key={c._id}
          to={`/customers/${c._id}`}
          className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 rounded px-1 py-1.5 hover:bg-muted sm:grid-cols-[10rem_1fr_auto]"
        >
          <span className="truncate text-sm font-medium">{c.name}</span>
          <div className="h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-blue-300"
              style={{ width: `${(c.totalBilled / max) * 100}%` }}
            />
          </div>
          <span className="text-right text-sm tabular-nums text-muted-foreground">
            {formatINR(c.totalBilled)}
          </span>
        </Link>
      ))}
    </div>
  );
}
