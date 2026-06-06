import { describe, it, expect } from "vitest";
import { formatINR, formatDate } from "./format";

describe("formatINR", () => {
  it("formats a number as INR with grouping", () => {
    const out = formatINR(1180);
    expect(out).toMatch(/₹/);
    expect(out).toContain("1,180");
  });
});

describe("formatDate", () => {
  it("formats an ISO date readably", () => {
    const out = formatDate("2026-01-15");
    expect(out).toContain("2026");
    expect(out).toContain("Jan");
  });
});
