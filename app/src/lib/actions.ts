"use server";

import { revalidatePath } from "next/cache";
import { sql } from "./db";
import { materializeRecurringEntries } from "./materialize";
import { DEFAULT_CATEGORIES } from "./seed-data";
import { currentUserId } from "./session";
import type { Cadence, DatePrecision, EntryKind } from "./types";

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function ownedProfileId(profileId: string, userId: string): Promise<boolean> {
  const [row] = await sql<{ id: string }[]>`
    select id from profiles where id = ${profileId} and user_id = ${userId}
  `;
  return !!row;
}

/* ---------- profiles ---------- */

export async function createProfile(name: string, color: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "A profile needs a name." };
  const userId = await currentUserId();
  const [profile] = await sql<{ id: string }[]>`
    insert into profiles (user_id, name, color, sort_order)
    values (${userId}, ${trimmed}, ${color},
            (select coalesce(max(sort_order), 0) + 1 from profiles where user_id = ${userId}))
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
  const userId = await currentUserId();
  await sql`
    update profiles set name = ${name.trim()}, color = ${color}
    where id = ${id} and user_id = ${userId}
  `;
  revalidateAll();
}

export async function deleteProfile(id: string) {
  const userId = await currentUserId();
  await sql`delete from profiles where id = ${id} and user_id = ${userId}`;
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
  const userId = await currentUserId();
  if (!(await ownedProfileId(profileId, userId))) {
    return { error: "Profile not found." };
  }
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
  const userId = await currentUserId();
  await sql`
    delete from categories c
    using profiles p
    where c.id = ${id} and c.profile_id = p.id and p.user_id = ${userId}
  `;
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
  occurredOn: string;
  recurringTemplateId?: string | null;
}

export async function createEntry(input: EntryInput) {
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  const userId = await currentUserId();
  if (!(await ownedProfileId(input.profileId, userId))) {
    return { error: "Profile not found." };
  }
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

export async function upsertTemplateEntry(input: EntryInput & { recurringTemplateId: string }) {
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  const userId = await currentUserId();
  if (!(await ownedProfileId(input.profileId, userId))) {
    return { error: "Profile not found." };
  }
  await sql`
    delete from recurring_skips rs
    using recurring_templates t, profiles p
    where rs.template_id = ${input.recurringTemplateId}
      and rs.occurred_on = ${input.occurredOn}
      and t.id = rs.template_id and p.id = t.profile_id and p.user_id = ${userId}
  `;
  await sql`
    insert into entries (profile_id, category_id, recurring_template_id,
                         amount, currency, description, date_precision, occurred_on)
    values (${input.profileId}, ${input.categoryId}, ${input.recurringTemplateId},
            ${input.amount}, ${input.currency}, ${input.description.trim()},
            ${input.datePrecision}, ${input.occurredOn})
    on conflict (recurring_template_id, occurred_on)
      where recurring_template_id is not null
    do update set
      amount = excluded.amount,
      description = excluded.description
  `;
  revalidateAll();
  return {};
}

export async function updateEntry(id: string, input: EntryInput) {
  if (!(input.amount > 0)) return { error: "Amount must be above zero." };
  const userId = await currentUserId();
  if (!(await ownedProfileId(input.profileId, userId))) {
    return { error: "Profile not found." };
  }
  await sql`
    update entries e set
      profile_id = ${input.profileId},
      category_id = ${input.categoryId},
      amount = ${input.amount},
      currency = ${input.currency},
      description = ${input.description.trim()},
      date_precision = ${input.datePrecision},
      occurred_on = ${input.occurredOn}
    from profiles p
    where e.id = ${id} and e.profile_id = p.id and p.user_id = ${userId}
  `;
  revalidateAll();
  return {};
}

export async function deleteEntry(id: string) {
  const userId = await currentUserId();
  const [row] = await sql<Record<string, unknown>[]>`
    delete from entries e
    using profiles p
    where e.id = ${id} and e.profile_id = p.id and p.user_id = ${userId}
    returning e.profile_id, e.category_id, e.recurring_template_id, e.amount::float8 as amount,
              trim(e.currency) as currency, e.description, e.date_precision,
              e.occurred_on::text as occurred_on
  `;
  if (row?.recurring_template_id) {
    await sql`
      insert into recurring_skips (template_id, occurred_on)
      values (${row.recurring_template_id as string}, ${row.occurred_on as string})
      on conflict do nothing
    `;
  }
  revalidateAll();
  return row ?? null;
}

export async function restoreEntry(row: Record<string, unknown>) {
  const userId = await currentUserId();
  if (!(await ownedProfileId(row.profile_id as string, userId))) {
    return;
  }
  if (row.recurring_template_id) {
    await sql`
      delete from recurring_skips
      where template_id = ${row.recurring_template_id as string}
        and occurred_on = ${row.occurred_on as string}
    `;
  }
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
  const userId = await currentUserId();
  if (!(await ownedProfileId(input.profileId, userId))) {
    return { error: "Profile not found." };
  }
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
  await materializeRecurringEntries(userId);
  revalidateAll();
  return {};
}

export async function updateTemplate(id: string, input: TemplateInput) {
  if (!input.name.trim()) return { error: "A template needs a name." };
  const userId = await currentUserId();
  if (!(await ownedProfileId(input.profileId, userId))) {
    return { error: "Profile not found." };
  }
  await sql`
    update recurring_templates t set
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
    from profiles p
    where t.id = ${id} and t.profile_id = p.id and p.user_id = ${userId}
  `;
  await materializeRecurringEntries(userId);
  revalidateAll();
  return {};
}

export async function deleteTemplate(id: string) {
  const userId = await currentUserId();
  await sql`
    delete from recurring_templates t
    using profiles p
    where t.id = ${id} and t.profile_id = p.id and p.user_id = ${userId}
  `;
  revalidateAll();
}

/* ---------- settings ---------- */

export async function updateSettings(displayCurrency: string, fxStaleHours: number) {
  const userId = await currentUserId();
  await sql`
    update app_settings
    set display_currency = ${displayCurrency}, fx_stale_hours = ${fxStaleHours}
    where user_id = ${userId}
  `;
  revalidateAll();
}

export async function refreshRatesNow() {
  await sql`update exchange_rates set fetched_at = '1970-01-01' where base_currency = 'EUR'`;
  revalidateAll();
}
