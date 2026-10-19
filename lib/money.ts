import type { Locale } from "@/types/index";

/**
 * Money is stored as an integer number of piastres (1 EGP = 100 piastres).
 *
 * `DOUBLE PRECISION` amounts cannot be summed safely (0.1 + 0.2 !== 0.3) and
 * every financial total in this app is a sum, so the database keeps BIGINT and
 * conversion to EGP happens only at the API boundary. UI code keeps working in
 * EGP floats: convert on the way in (`toPiastres`) and on the way out
 * (`fromPiastres`).
 */

export const EGP_PIASTRES = 100;

/** EGP (float) → integer piastres for storage. */
export const toPiastres = (egp: number): number => {
  if (!Number.isFinite(egp)) return 0;
  return Math.round(egp * EGP_PIASTRES);
};

/** Integer piastres → EGP (float) for display and arithmetic in the UI. */
export const fromPiastres = (piastres: number): number => {
  if (!Number.isFinite(piastres)) return 0;
  return Math.round(piastres) / EGP_PIASTRES;
};

/** Accepts a raw form value ("1 250,50", "1250.5", 1250.5) as piastres. */
export const toPiastresFromInput = (input: string | number): number => {
  const normalized =
    typeof input === "number"
      ? input
      : input.replace(/\s|٬/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) ? toPiastres(value) : 0;
};

/** Renders integer piastres as a currency string in the active locale. */
export const formatMoney = (piastres: number, locale: Locale): string =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(fromPiastres(piastres));
