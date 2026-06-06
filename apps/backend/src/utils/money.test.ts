import { describe, it, expect } from "vitest";
import { round2 } from "./money.js";

describe("round2", () => {
  it("rounds to two decimals", () => {
    expect(round2(180)).toBe(180);
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBe(1.24);
  });

  it("handles the binary-float edge case (1.005 → 1.01)", () => {
    // naive Math.round(1.005 * 100) / 100 yields 1.00; the EPSILON nudge fixes it
    expect(round2(1.005)).toBe(1.01);
  });

  it("matches tax/total math for amount 1000 @ 18%", () => {
    const tax = round2((1000 * 18) / 100);
    expect(tax).toBe(180);
    expect(round2(1000 + tax)).toBe(1180);
  });
});
