export type EntryKind = "income" | "expense";
export type Classification =
  | "fixed_recurring"
  | "variable_recurring"
  | "discretionary"
  | "irregular";
export type Cadence = "weekly" | "monthly" | "quarterly" | "yearly";
export type DatePrecision = "day" | "month" | "year";

export interface Profile {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  archived_at: string | null;
}

export interface Category {
  id: string;
  profile_id: string;
  name: string;
  kind: EntryKind;
  classification: Classification;
}

export interface RecurringTemplate {
  id: string;
  profile_id: string;
  category_id: string;
  name: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  day_of_month: number | null;
  start_date: string;
  end_date: string | null;
  is_variable: boolean;
  amount_min: number | null;
  amount_max: number | null;
  category_name: string;
  category_kind: EntryKind;
  profile_name: string;
  profile_color: string;
}

export interface Entry {
  id: string;
  profile_id: string;
  category_id: string;
  recurring_template_id: string | null;
  amount: number;
  currency: string;
  description: string;
  date_precision: DatePrecision;
  occurred_on: string;
  period_start: string;
  period_end: string;
  category_name: string;
  category_kind: EntryKind;
  classification: Classification;
  profile_name: string;
  profile_color: string;
}

export interface Settings {
  display_currency: string;
  theme: string;
  fx_stale_hours: number;
}

export interface RateInfo {
  /** target currency -> units per 1 EUR */
  rates: Map<string, number>;
  fetchedAt: Date | null;
  source: string;
}

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  fixed_recurring: "Fixed recurring",
  variable_recurring: "Variable recurring",
  discretionary: "Discretionary",
  irregular: "Irregular",
};

export const PROFILE_PALETTE = [
  "#6B7F6A",
  "#B87333",
  "#2C3E50",
  "#8C6D9E",
  "#A8763E",
  "#4E6E81",
];
