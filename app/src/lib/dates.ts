import {
  addMonths,
  addQuarters,
  addYears,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  parse,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import type { DatePrecision } from "./types";

export type PeriodScope = "month" | "quarter" | "year";

export interface Period {
  scope: PeriodScope;
  start: Date;
  end: Date;
  key: string;
  label: string;
  prevKey: string;
  nextKey: string;
}

/**
 * Period keys as they appear in the URL: "2026-07", "2026-Q3", "2026".
 */
export function parsePeriod(key: string | undefined): Period {
  const now = new Date();
  if (key && /^\d{4}$/.test(key)) {
    const d = parse(key, "yyyy", now);
    return build("year", startOfYear(d));
  }
  if (key && /^\d{4}-Q[1-4]$/.test(key)) {
    const [y, q] = key.split("-Q");
    const d = new Date(Number(y), (Number(q) - 1) * 3, 1);
    return build("quarter", startOfQuarter(d));
  }
  if (key && /^\d{4}-\d{2}$/.test(key)) {
    const d = parse(key, "yyyy-MM", now);
    if (!isNaN(d.getTime())) return build("month", startOfMonth(d));
  }
  return build("month", startOfMonth(now));
}

function build(scope: PeriodScope, start: Date): Period {
  if (scope === "year") {
    return {
      scope,
      start,
      end: endOfYear(start),
      key: format(start, "yyyy"),
      label: format(start, "yyyy"),
      prevKey: format(addYears(start, -1), "yyyy"),
      nextKey: format(addYears(start, 1), "yyyy"),
    };
  }
  if (scope === "quarter") {
    const fmt = (d: Date) => `${format(d, "yyyy")}-Q${format(d, "Q")}`;
    return {
      scope,
      start,
      end: endOfQuarter(start),
      key: fmt(start),
      label: `Q${format(start, "Q yyyy")}`,
      prevKey: fmt(addQuarters(start, -1)),
      nextKey: fmt(addQuarters(start, 1)),
    };
  }
  return {
    scope,
    start,
    end: endOfMonth(start),
    key: format(start, "yyyy-MM"),
    label: format(start, "MMMM yyyy"),
    prevKey: format(addMonths(start, -1), "yyyy-MM"),
    nextKey: format(addMonths(start, 1), "yyyy-MM"),
  };
}

/** Convert current period to a sibling scope, anchored on the period start. */
export function periodKeyForScope(p: Period, scope: PeriodScope): string {
  if (scope === "year") return format(p.start, "yyyy");
  if (scope === "quarter")
    return `${format(p.start, "yyyy")}-Q${format(p.start, "Q")}`;
  return format(p.start, "yyyy-MM");
}

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Honest display of a partial date: "Jul 10, 2026" / "July 2026" / "2026". */
export function formatOccurrence(
  occurredOn: string,
  precision: DatePrecision
): string {
  const d = parse(occurredOn, "yyyy-MM-dd", new Date());
  if (precision === "day") return format(d, "MMM d, yyyy");
  if (precision === "month") return format(d, "MMMM yyyy");
  return format(d, "yyyy");
}
