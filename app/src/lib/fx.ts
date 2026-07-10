import { sql } from "./db";
import type { RateInfo } from "./types";

const FX_API_URL = process.env.FX_API_URL ?? "https://api.frankfurter.app";

/**
 * Returns EUR-based rates, refreshing the DB cache from Frankfurter (ECB)
 * when it is older than `fx_stale_hours`. Falls back to the last cached
 * rates if the API is unreachable.
 */
export async function getRates(staleHours: number): Promise<RateInfo> {
  const cached = await readCache();
  const staleMs = staleHours * 3600_000;
  const isFresh =
    cached.fetchedAt !== null &&
    Date.now() - cached.fetchedAt.getTime() < staleMs;

  if (isFresh && cached.rates.size > 0) return cached;

  try {
    const res = await fetch(`${FX_API_URL}/latest?from=EUR`, {
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`FX API responded ${res.status}`);
    const data = (await res.json()) as { rates: Record<string, number> };

    const rows = Object.entries(data.rates).map(([target, rate]) => ({
      base_currency: "EUR",
      target_currency: target,
      rate,
    }));
    rows.push({ base_currency: "EUR", target_currency: "EUR", rate: 1 });

    await sql`
      insert into exchange_rates ${sql(rows, "base_currency", "target_currency", "rate")}
      on conflict (base_currency, target_currency)
      do update set rate = excluded.rate, fetched_at = now()
    `;
    return readCache();
  } catch {
    // Offline or API down: last known rates are better than none.
    return cached;
  }
}

async function readCache(): Promise<RateInfo> {
  const rows = await sql<
    { target_currency: string; rate: string; fetched_at: Date }[]
  >`select target_currency, rate, fetched_at from exchange_rates where base_currency = 'EUR'`;
  const rates = new Map<string, number>();
  let fetchedAt: Date | null = null;
  for (const r of rows) {
    rates.set(r.target_currency.trim(), Number(r.rate));
    if (!fetchedAt || r.fetched_at > fetchedAt) fetchedAt = r.fetched_at;
  }
  rates.set("EUR", 1);
  return { rates, fetchedAt, source: "ecb/frankfurter" };
}

/** Convert via EUR cross rates. Returns null when a rate is missing. */
export function convert(
  amount: number,
  from: string,
  to: string,
  info: RateInfo
): number | null {
  if (from === to) return amount;
  const rFrom = info.rates.get(from);
  const rTo = info.rates.get(to);
  if (!rFrom || !rTo) return null;
  return (amount / rFrom) * rTo;
}
