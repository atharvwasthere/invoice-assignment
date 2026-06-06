import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
}

/** "Showing X–Y of N" + windowed page buttons. */
export function Pagination({ page, limit, total, onPage }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // a small window of page numbers around the current page
  const windowSize = 3;
  const start = Math.max(1, Math.min(page - 1, totalPages - windowSize + 1));
  const pages = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => start + i,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <span className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total.toLocaleString("en-IN")}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPage(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
