import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** A labelled metric tile used on the summary and customer-profile views. */
export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-none bg-muted shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold tabular-nums">
        {value}
      </CardContent>
    </Card>
  );
}
