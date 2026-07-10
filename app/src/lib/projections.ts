import {
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  differenceInWeeks,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  setDate,
} from "date-fns";
import type { RateInfo, RecurringTemplate } from "./types";
import { isoDate } from "./dates";
import { convert } from "./fx";

export interface TemplateProjection {
  template: RecurringTemplate;
  occurrences: number;
  /** in the template's native currency */
  projected: number;
  /** converted to display currency; null when no FX rate is known */
  projectedDisplay: number | null;
}

/** Scheduled occurrence dates for a template inside [periodStart, periodEnd]. */
export function occurrenceDatesInPeriod(
  t: RecurringTemplate,
  periodStart: Date,
  periodEnd: Date
): string[] {
  const templateStart = parseISO(t.start_date);
  const templateEnd = t.end_date ? parseISO(t.end_date) : null;

  const windowEnd = templateEnd && isBefore(templateEnd, periodEnd) ? templateEnd : periodEnd;
  if (isAfter(templateStart, windowEnd)) return [];

  let cursor = firstOccurrenceNear(t, templateStart, periodStart);
  const dates: string[] = [];
  while (!isAfter(cursor, windowEnd)) {
    if (!isBefore(cursor, periodStart) && !isBefore(cursor, templateStart)) {
      dates.push(isoDate(cursor));
    }
    cursor = step(t, cursor);
  }
  return dates;
}

/** All occurrence dates from template start through upTo (inclusive). */
export function occurrenceDatesUpTo(t: RecurringTemplate, upTo: Date): string[] {
  return occurrenceDatesInPeriod(t, parseISO(t.start_date), upTo);
}

export function occurrencesInPeriod(
  t: RecurringTemplate,
  periodStart: Date,
  periodEnd: Date
): number {
  return occurrenceDatesInPeriod(t, periodStart, periodEnd).length;
}

function firstOccurrenceNear(
  t: RecurringTemplate,
  templateStart: Date,
  periodStart: Date
): Date {
  const anchor = withDayOfMonth(t, templateStart);
  if (!isBefore(anchor, periodStart)) return anchor;
  switch (t.cadence) {
    case "weekly": {
      const weeks = Math.max(0, differenceInWeeks(periodStart, anchor) - 1);
      return addWeeks(anchor, weeks);
    }
    case "monthly": {
      const months = Math.max(0, differenceInCalendarMonths(periodStart, anchor) - 1);
      return withDayOfMonth(t, addMonths(anchor, months));
    }
    case "quarterly": {
      const quarters = Math.max(
        0,
        Math.floor(differenceInCalendarMonths(periodStart, anchor) / 3) - 1
      );
      return withDayOfMonth(t, addMonths(anchor, quarters * 3));
    }
    case "yearly": {
      const years = Math.max(0, differenceInCalendarYears(periodStart, anchor) - 1);
      return withDayOfMonth(t, addYears(anchor, years));
    }
  }
}

function step(t: RecurringTemplate, d: Date): Date {
  switch (t.cadence) {
    case "weekly":
      return addWeeks(d, 1);
    case "monthly":
      return withDayOfMonth(t, addMonths(d, 1));
    case "quarterly":
      return withDayOfMonth(t, addMonths(d, 3));
    case "yearly":
      return withDayOfMonth(t, addYears(d, 1));
  }
}

function withDayOfMonth(t: RecurringTemplate, d: Date): Date {
  if (t.cadence === "weekly" || !t.day_of_month) return d;
  return setDate(d, Math.min(t.day_of_month, getDaysInMonth(d)));
}

export function projectTemplates(
  templates: RecurringTemplate[],
  periodStart: Date,
  periodEnd: Date,
  displayCurrency: string,
  rates: RateInfo
): TemplateProjection[] {
  return templates.map((template) => {
    const occurrences = occurrencesInPeriod(template, periodStart, periodEnd);
    const projected = occurrences * Number(template.amount);
    return {
      template,
      occurrences,
      projected,
      projectedDisplay: convert(projected, template.currency, displayCurrency, rates),
    };
  });
}
