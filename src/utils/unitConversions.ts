// ── Canonical storage units ───────────────────────────────────────────────────
// Weight  → always stored in oz
// Length  → always stored in inches
// MSRP    → always stored in USD
// ─────────────────────────────────────────────────────────────────────────────

const USD_TO_EUR = 0.92; // static approximate rate

// ── Currency ─────────────────────────────────────────────────────────────────

/**
 * Format a USD-stored price for display in the user's preferred currency.
 * Returns "" for null / zero / non-numeric values.
 */
export function formatCurrency(
  value: string | number | null | undefined,
  currency: "USD" | "EUR" | null | undefined,
): string {
  const num = parseFloat(String(value ?? ""));
  if (!value || isNaN(num) || num <= 0) return "";

  if (currency === "EUR") {
    const eur = num * USD_TO_EUR;
    return `€${eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Default: USD
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Weight ────────────────────────────────────────────────────────────────────

/**
 * Format an oz-stored weight for display in the user's preferred unit system.
 * Returns "" for null / zero / non-numeric values.
 */
export function formatWeight(
  value: string | number | null | undefined,
  unit: "imperial" | "metric" | null | undefined,
): string {
  const num = parseFloat(String(value ?? ""));
  if (!value || isNaN(num) || num <= 0) return "";

  if (unit === "metric") {
    return `${(num * 28.3495).toFixed(1)}g`;
  }

  // Default: imperial (oz)
  return `${num.toFixed(2)}oz`;
}

// ── Length ────────────────────────────────────────────────────────────────────

/**
 * Format an inch-stored length for display in the user's preferred unit system.
 * Returns "" for null / zero / non-numeric values.
 */
export function formatLength(
  value: string | number | null | undefined,
  unit: "imperial" | "metric" | null | undefined,
): string {
  const num = parseFloat(String(value ?? ""));
  if (!value || isNaN(num) || num <= 0) return "";

  if (unit === "metric") {
    return `${(num * 2.54).toFixed(1)}cm`;
  }

  // Default: imperial (inches)
  return `${num.toFixed(1)}"`;
}
