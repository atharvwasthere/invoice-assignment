import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/MetricCard";
import { ErrorState } from "@/components/ErrorState";
import { TopCustomersBars } from "@/components/customers/TopCustomersBars";
import { useSummary } from "@/hooks/useSummary";
import { formatINR } from "@/lib/format";

export function SummaryPage() {
  const { data, isLoading, isError, refetch } = useSummary();

  if (isError) {
    return (
      <ErrorState message="Couldn't load the summary." onRetry={() => refetch()} />
    );
  }
  if (isLoading || !data) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Total billed" value={formatINR(data.totalBilled)} />
        <MetricCard label="Total tax" value={formatINR(data.totalTax)} />
        <MetricCard
          label="Invoices"
          value={data.invoiceCount.toLocaleString("en-IN")}
        />
        <MetricCard
          label="Customers"
          value={data.customerCount.toLocaleString("en-IN")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top customers by value</CardTitle>
        </CardHeader>
        <CardContent>
          <TopCustomersBars customers={data.topCustomers} />
        </CardContent>
      </Card>
    </div>
  );
}
