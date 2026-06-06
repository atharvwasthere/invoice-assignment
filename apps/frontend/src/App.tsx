import { lazy, Suspense } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";

// Route-level code splitting: each page (and its heavy deps — the form's radix/RHF/zod,
// etc.) loads only when that route is visited, keeping the initial bundle small on mobile.
const InvoiceListPage = lazy(() =>
  import("@/pages/InvoiceListPage").then((m) => ({ default: m.InvoiceListPage })),
);
const CustomerProfilePage = lazy(() =>
  import("@/pages/CustomerProfilePage").then((m) => ({
    default: m.CustomerProfilePage,
  })),
);
const SummaryPage = lazy(() =>
  import("@/pages/SummaryPage").then((m) => ({ default: m.SummaryPage })),
);

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold">
            Invoice Management Dashboard
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link to="/">Invoices</Link>
            <Link to="/summary">Summary</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Routes>
            <Route path="/" element={<InvoiceListPage />} />
            <Route path="/customers/:id" element={<CustomerProfilePage />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster richColors />
    </div>
  );
}
