import type { InvoiceStatus } from "@invoice/shared";

/** Tailwind classes per invoice status, shared by the table badge and profile chips. */
export const STATUS_CLASS: Record<InvoiceStatus, string> = {
  Paid: "bg-green-100 text-green-800",
  Sent: "bg-blue-100 text-blue-800",
  Unpaid: "bg-amber-100 text-amber-800",
  Overdue: "bg-red-100 text-red-800",
  Draft: "bg-gray-100 text-gray-700",
  Void: "bg-gray-200 text-gray-500 line-through",
};
