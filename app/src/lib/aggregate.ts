import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  isBefore,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { CashFlowBucket } from "@/components/charts/CashFlow";
import type { VarianceRow } from "@/components/charts/VarianceBars";
import { convert } from "./fx";
import type { TemplateProjection } from "./projections";
import type { Entry, RateInfo } from "./types";
import type { Period } from "./dates";

export interface ConvertedEntry extends Entry {
  /** amount in the display currency; null when no FX rate is known */
  display_amount: number | null;
}

export function convertEntries(
  entries: Entry[],
  displayCurrency: string,
  rates: RateInfo
): ConvertedEntry[] {
  return entries.map((e) => ({
    ...e,
    display_amount: convert(Number(e.amount), e.currency, displayCurrency, rates),
  }));
}

export function sumByKind(entries: ConvertedEntry[]) {
  let income = 0;
  let expense = 0;
  let unconverted = 0;
  for (const e of entries) {
    if (e.display_amount === null) {
      unconverted += 1;
      continue;
    }
    if (e.category_kind === "income") income += e.display_amount;
    else expense += e.display_amount;
  }
  return { income, expense, net: income - expense, unconverted };
}

/**
 * Buckets for the cash-flow chart: days within a month, months within a
 * quarter or year. Entries with month/year precision are spread evenly
 * across the days their period overlaps with each bucket, so imprecise
 * records still shape the chart honestly.
 */
export function bucketize(
  entries: ConvertedEntry[],
  period: Period
): CashFlowBucket[] {
  const spans: { start: Date; end: Date; label: string }[] = [];
  if (period.scope === "month") {
    const days = differenceInCalendarDays(period.end, period.start) + 1;
    for (let i = 0; i < days; i++) {
      const d = addDays(period.start, i);
      spans.push({ start: d, end: d, label: format(d, "d") });
    }
  } else {
    let cursor = startOfMonth(period.start);
    while (!isBefore(period.end, cursor)) {
      const next = addMonths(cursor, 1);
      spans.push({
        start: cursor,
        end: addDays(next, -1),
        label: format(cursor, "MMM"),
      });
      cursor = next;
    }
  }

  const buckets: CashFlowBucket[] = spans.map((s) => ({
    label: s.label,
    income: 0,
    expense: 0,
  }));

  for (const e of entries) {
    if (e.display_amount === null) continue;
    const eStart = parseISO(e.period_start);
    const eEnd = parseISO(e.period_end);
    const totalDays = differenceInCalendarDays(eEnd, eStart) + 1;
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      const oStart = maxDate([eStart, s.start]);
      const oEnd = minDate([eEnd, s.end]);
      if (isBefore(oEnd, oStart)) continue;
      const overlap = differenceInCalendarDays(oEnd, oStart) + 1;
      const share = e.display_amount * (overlap / totalDays);
      if (e.category_kind === "income") buckets[i].income += share;
      else buckets[i].expense += share;
    }
  }
  return buckets;
}

export function byCategory(
  entries: ConvertedEntry[],
  kind: "income" | "expense"
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.category_kind !== kind || e.display_amount === null) continue;
    map.set(e.category_name, (map.get(e.category_name) ?? 0) + e.display_amount);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Projected vs actual per category that has at least one recurring template. */
export function varianceRows(
  projections: TemplateProjection[],
  entries: ConvertedEntry[]
): VarianceRow[] {
  const byCat = new Map<string, VarianceRow>();
  for (const p of projections) {
    if (p.projectedDisplay === null || p.occurrences === 0) continue;
    const key = p.template.category_id;
    const row = byCat.get(key) ?? {
      name: p.template.category_name,
      kind: p.template.category_kind,
      projected: 0,
      actual: 0,
    };
    row.projected += p.projectedDisplay;
    byCat.set(key, row);
  }
  for (const e of entries) {
    const row = byCat.get(e.category_id);
    if (!row || e.display_amount === null) continue;
    row.actual += e.display_amount;
  }
  return [...byCat.values()].sort((a, b) => b.projected - a.projected);
}
