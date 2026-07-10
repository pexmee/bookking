"use server";

import { revalidatePath } from "next/cache";
import { sql } from "./db";
import type { Cadence, DatePrecision, EntryKind } from "./types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ---------- profiles ---------- */

const DEFAULT_CATEGORIES: [string, EntryKind, string][] = [
  ["Salary", "income", "fixed_recurring"],
  ["Freelance", "income", "variable_recurring"],
  ["Other income", "income", "irregular"],
  ["Rent", "expense", "fixed_recurring"],
  ["Subscriptions", "expense", "fixed_recurring"],
  ["Utilities", "expense", "variable_recurring"],
  ["Groceries", "expense", "variable_recurring"],
  ["Transport", "expense", "variable_recurring"],
  ["Dining out", "expense", "discretionary"],
  ["Entertainment", "expense", "discretionary"],
  ["Travel", "expense", "irregular"],
  ["Health", "expense", "irregular"],
  ["Other", "expense", "irregular"],
];

export async function createProfile(name: string, color: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "A profile needs a name." };
  const [profile] = await sql<{ id: string }[]>`
    insert into profiles (name, color, sort_order)
    values (${trimmed}, ${color},
            (select coalesce(max(sort_order), 0) + 1 from profiles))
    returning id
  `;
  const rows = DEFAULT_CATEGORIES.map(([n, kind, classification]) => ({
    profile_id: profile.id,
    name: n,
    kind,
    classification,
  }));
  await sql`insert into categories ${sql(rows)}`;
  revalidateAll();
  return { id: profile.id };
}

export async function updateProfile(id: string, name: string, color: string) {
  await sql`update profiles set name = ${name.trim()}, color = ${color} where id = ${id}`;
  revalidateAll();
}

export async function deleteProfile(id: string) {
  await sql`delete from profiles where id = ${id}`;
  revalidateAll();
}

/* ---------- categories ---------- */

export async function createCategory(
  profileId: string,
  name: string,
  kind: EntryKind,
  classification: string
) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "A category needs a name." };
  try {
    await sql`
      insert into categories (profile_id, name, kind, classification)
      values (${profileId}, ${trimmed}, ${kind}, ${classification})
    `;
  } catch {
    return { error: `"${trimmed}" already exists for this profile.` };
  }
  revalidateAll();
  return {};
}

export async function deleteCategory(id: string) {
  await sql`delete from categories where id = ${id}`;
  revalidateAll();
}

/* ---------- entries ---------- */

export interface EntryInput {
  profileId: string;
  categoryId: string;
  amount: number;
  currency: string;
  description: string;
  datePrecision: DatePrecision;
  occurredOn: string; // yyyy-MM-dd anchor
  recurringTemplateId?: string | null;
}

export async function createEntry(input: EntryInput) {
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  await sql`
    insert into entries (profile_id, category_id, recurring_template_id,
                         amount, currency, description, date_precision, occurred_on)
    values (${input.profileId}, ${input.categoryId},
            ${input.recurringTemplateId ?? null}, ${input.amount},
            ${input.currency}, ${input.description.trim()},
            ${input.datePrecision}, ${input.occurredOn})
  `;
  revalidateAll();
  return {};
}

export async function updateEntry(id: string, input: EntryInput) {
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  await sql`
    update entries set
      profile_id = ${input.profileId},
      category_id = ${input.categoryId},
      amount = ${input.amount},
      currency = ${input.currency},
      description = ${input.description.trim()},
      date_precision = ${input.datePrecision},
      occurred_on = ${input.occurredOn}
    where id = ${id}
  `;
  revalidateAll();
  return {};
}

/** Returns the deleted row so the client can offer undo. */
export async function deleteEntry(id: string) {
  const [row] = await sql<Record<string, unknown>[]>`
    delete from entries where id = ${id}
    returning profile_id, category_id, recurring_template_id, amount::float8 as amount,
              trim(currency) as currency, description, date_precision,
              occurred_on::text as occurred_on
  `;
  revalidateAll();
  return row ?? null;
}

export async function restoreEntry(row: Record<string, unknown>) {
  await sql`
    insert into entries (profile_id, category_id, recurring_template_id,
                         amount, currency, description, date_precision, occurred_on)
    values (${row.profile_id as string}, ${row.category_id as string},
            ${(row.recurring_template_id as string) ?? null},
            ${row.amount as number}, ${row.currency as string},
            ${row.description as string}, ${row.date_precision as string},
            ${row.occurred_on as string})
  `;
  revalidateAll();
}

/* ---------- recurring templates ---------- */

export interface TemplateInput {
  profileId: string;
  categoryId: string;
  name: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  isVariable: boolean;
  amountMin: number | null;
  amountMax: number | null;
}

export async function createTemplate(input: TemplateInput) {
  if (!input.name.trim()) return { error: "A template needs a name." };
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  await sql`
    insert into recurring_templates
      (profile_id, category_id, name, amount, currency, cadence, day_of_month,
       start_date, end_date, is_variable, amount_min, amount_max)
    values
      (${input.profileId}, ${input.categoryId}, ${input.name.trim()},
       ${input.amount}, ${input.currency}, ${input.cadence}, ${input.dayOfMonth},
       ${input.startDate}, ${input.endDate}, ${input.isVariable},
       ${input.amountMin}, ${input.amountMax})
  `;
  revalidateAll();
  return {};
}

export async function updateTemplate(id: string, input: TemplateInput) {
  if (!input.name.trim()) return { error: "A template needs a name." };
  await sql`
    update recurring_templates set
      profile_id = ${input.profileId},
      category_id = ${input.categoryId},
      name = ${input.name.trim()},
      amount = ${input.amount},
      currency = ${input.currency},
      cadence = ${input.cadence},
      day_of_month = ${input.dayOfMonth},
      start_date = ${input.startDate},
      end_date = ${input.endDate},
      is_variable = ${input.isVariable},
      amount_min = ${input.amountMin},
      amount_max = ${input.amountMax}
    where id = ${id}
  `;
  revalidateAll();
  return {};
}

export async function deleteTemplate(id: string) {
  await sql`delete from recurring_templates where id = ${id}`;
  revalidateAll();
}

/* ---------- settings ---------- */

export async function updateSettings(displayCurrency: string, fxStaleHours: number) {
  await sql`
    update app_settings
    set display_currency = ${displayCurrency}, fx_stale_hours = ${fxStaleHours}
    where id = true
  `;
  revalidateAll();
}

export async function refreshRatesNow() {
  await sql`update exchange_rates set fetched_at = '1970-01-01' where base_currency = 'EUR'`;
  revalidateAll();
}
