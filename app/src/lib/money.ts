/** Currencies supported by the ECB reference rates (Frankfurter). */
export const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "SEK",
  "NOK",
  "DKK",
  "CHF",
  "JPY",
  "AUD",
  "CAD",
  "NZD",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "TRY",
  "ISK",
  "THB",
  "SGD",
  "HKD",
  "CNY",
  "INR",
  "KRW",
  "MXN",
  "BRL",
  "ZAR",
  "MYR",
  "IDR",
  "PHP",
  "ILS",
] as const;

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

/** Compact form for chart axes: $1.2k, kr 45k. */
export function formatMoneyCompact(amount: number, currency: string): string {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
