import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";

type Field = "issued" | "due";

const KEYS: Record<Field, { from: string; to: string }> = {
  issued: { from: "issueDateFrom", to: "issueDateTo" },
  due: { from: "dueDateFrom", to: "dueDateTo" },
};

/** Local yyyy-mm-dd (avoids the UTC day-shift that toISOString can cause). */
const fmt = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

interface Props {
  values: Record<string, string>;
  onChangeMany: (updates: Record<string, string>) => void;
}

/**
 * One date filter for the table: pick the field (Issued / Due), then dates from a single
 * calendar. Picking one day filters that exact day; picking two filters the inclusive
 * range. Selection is held locally while the popover is open and committed to the URL on
 * close, so a half-picked range never leaks a partial filter.
 */
export function DateRangeFilter({ values, onChangeMany }: Props) {
  const initialField: Field =
    values.dueDateFrom || values.dueDateTo ? "due" : "issued";
  const [field, setField] = useState<Field>(initialField);
  const [open, setOpen] = useState(false);

  const keys = KEYS[field];
  const fromUrl = (k: { from: string; to: string }): DateRange | undefined =>
    values[k.from] || values[k.to]
      ? {
          from: values[k.from] ? new Date(values[k.from]) : undefined,
          to: values[k.to] ? new Date(values[k.to]) : undefined,
        }
      : undefined;

  const [range, setRange] = useState<DateRange | undefined>(fromUrl(keys));

  /** Write the range to the URL for `target`. A single day (no `to`) becomes that exact
   *  day (from === to), so the filter means "on that day", not "on or after". */
  const commit = (target: Field, r: DateRange | undefined) => {
    const k = KEYS[target];
    const from = r?.from;
    const to = r?.to ?? r?.from;
    onChangeMany({
      issueDateFrom: "",
      issueDateTo: "",
      dueDateFrom: "",
      dueDateTo: "",
      [k.from]: from ? fmt(from) : "",
      [k.to]: to ? fmt(to) : "",
    });
  };

  const handleFieldChange = (f: Field) => {
    setField(f);
    commit(f, range); // retarget the current selection to the new field
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) commit(field, range); // commit on close
  };

  const clear = () => {
    setRange(undefined);
    commit(field, undefined);
  };

  const label = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${formatDate(range.from.toISOString())} – ${formatDate(range.to.toISOString())}`
      : formatDate(range.from.toISOString())
    : "Pick date(s)";

  return (
    <div className="flex items-center gap-2">
      <Select value={field} onValueChange={(v) => handleFieldChange(v as Field)}>
        <SelectTrigger className="w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="issued">Issued</SelectItem>
          <SelectItem value="due">Due</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[210px] justify-start font-normal"
          >
            <CalendarIcon className="mr-2 size-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            autoFocus
          />
          <div className="border-t p-2 text-center">
            <p className="mb-1 text-xs text-muted-foreground">
              One day = that date · two days = a range
            </p>
            {range?.from && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clear}
              >
                Clear dates
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
