/**
 * Money math helpers.
 *
 * round2 nudges by Number.EPSILON before rounding to dodge binary-float artefacts
 * (e.g. `1.005 * 100` is actually `100.4999…`, which would round down to 1.00).
 * Shared by both the invoice service (tax/total derivation) and the customer service
 * (metric aggregation) so the rounding rule is defined exactly once.
 */
export const round2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;
