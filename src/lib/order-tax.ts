/** Brentwood / Williamson County combined sales-tax rate. Confirm with the restaurant when it changes. */
export const ORDER_TAX_RATE = 0.0975;

export function calculateOrderTax(subtotal: number) {
  return Number((subtotal * ORDER_TAX_RATE).toFixed(2));
}

export const ALCOHOL_CATEGORY_KEYS = new Set([
  "beers",
  "margaritas",
  "daiquiris",
  "mixed_drinks",
  "wines",
]);
