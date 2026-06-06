import { Link, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/MetricCard";
import { ErrorState } from "@/components/ErrorState";
import { StatusChips } from "@/components/customers/StatusChips";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { formatINR, formatDate } from "@/lib/format";
import { STATUS_CLASS } from "@/lib/statusStyles";

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useCustomerProfile(id);

  if (isError) {
    return (
      <ErrorState
        message="Couldn't load this customer."
        onRetry={() => refetch()}
      />
    );
  }
  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const { customer, metrics, statusCounts, invoices } = data;
  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">
          Invoices
        </Link>{" "}
        / Customer
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
          {initials}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.company}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total billed" value={formatINR(metrics.totalBilled)} />
        <MetricCard label="Total tax" value={formatINR(metrics.totalTax)} />
        <MetricCard label="Outstanding" value={formatINR(metrics.totalOutstanding)} />
        <MetricCard
          label="Invoices"
          value={metrics.invoiceCount.toLocaleString("en-IN")}
        />
      </div>

      <StatusChips counts={statusCounts} />

      <div>
        <h2 className="mb-2 font-semibold">Invoice history</h2>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Invoice</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell className="font-medium">{inv.invoiceId}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatINR(inv.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_CLASS[inv.status]}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(inv.issueDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
