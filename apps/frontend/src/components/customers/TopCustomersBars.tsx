import { Link } from "react-router-dom";
import type { CustomerSummary } from "@invoice/shared";
import { formatINR } from "@/lib/format";

/** Horizontal value bars for the top customers — plain divs, no chart library. */
export function TopCustomersBars({ customers }: { customers: CustomerSummary[] }) {
  const max = Math.max(1, ...customers.map((c) => c.totalBilled));
  return (
    <div className="space-y-3">
      {customers.map((c) => (
        <Link key={c._id} to={`/customers/${c._id}`} className="block hover:opacity-80">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{c.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatINR(c.totalBilled)}
            </span>
          </div>
          <div className="mt-1 h-2 rounded bg-muted">
            <div
              className="h-2 rounded bg-blue-300"
              style={{ width: `${(c.totalBilled / max) * 100}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
