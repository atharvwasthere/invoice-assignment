import { Button } from "@/components/ui/button";

/** Inline error panel with an optional retry, shown when a query fails. */
export function ErrorState({
  message = "Something went wrong while loading data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
