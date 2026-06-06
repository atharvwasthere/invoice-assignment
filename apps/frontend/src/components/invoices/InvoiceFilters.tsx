import { useEffect, useState } from "react";
import { INVOICE_STATUSES, TAX_RATES, type ICustomer } from "@invoice/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangeFilter } from "./DateRangeFilter";

const ALL = "all"; // sentinel for "no filter" (shadcn Select can't use an empty value)

interface Props {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onChangeMany: (updates: Record<string, string>) => void;
  customers: ICustomer[];
}

/**
 * Invoice table filters: debounced search + status/taxRate/customer selects + issue/due
 * date ranges. Each control writes a single URL param via `onChange`; the search box is
 * debounced locally so typing doesn't fire a request per keystroke.
 */
export function InvoiceFilters({
  values,
  onChange,
  onChangeMany,
  customers,
}: Props) {
  const [search, setSearch] = useState(values.search ?? "");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch !== (values.search ?? "")) {
      onChange("search", debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search invoice / customer"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-w-[200px] flex-1"
      />

      <Select
        value={values.status || ALL}
        onValueChange={(v) => onChange("status", v === ALL ? "" : v)}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {INVOICE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={values.taxRate || ALL}
        onValueChange={(v) => onChange("taxRate", v === ALL ? "" : v)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Tax rate" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All tax</SelectItem>
          {TAX_RATES.map((r) => (
            <SelectItem key={r} value={String(r)}>
              {r}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={values.customer || ALL}
        onValueChange={(v) => onChange("customer", v === ALL ? "" : v)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All customers</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangeFilter values={values} onChangeMany={onChangeMany} />
    </div>
  );
}
