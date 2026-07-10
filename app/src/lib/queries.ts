import { sql } from "./db";
import type {
  Category,
  Entry,
  Profile,
  RecurringTemplate,
  Settings,
} from "./types";

export async function getSettings(): Promise<Settings> {
  const initial = process.env.DEFAULT_DISPLAY_CURRENCY ?? "USD";
  const rows = await sql<Settings[]>`
    insert into app_settings (id, display_currency)
    values (true, ${initial})
    on conflict (id) do update set id = true
    returning display_currency, theme, fx_stale_hours
  `;
  return { ...rows[0], display_currency: rows[0].display_currency.trim() };
}

export async function getProfiles(includeArchived = false): Promise<Profile[]> {
  return sql<Profile[]>`
    select id, name, color, sort_order, archived_at
    from profiles
    ${includeArchived ? sql`` : sql`where archived_at is null`}
    order by sort_order, created_at
  `;
}

export async function getCategories(profileIds: string[] | null): Promise<Category[]> {
  return sql<Category[]>`
    select id, profile_id, name, kind, classification
    from categories
    ${profileIds ? sql`where profile_id in ${sql(profileIds)}` : sql``}
    order by kind desc, name
  `;
}

const entrySelect = sql`
  select e.id, e.profile_id, e.category_id, e.recurring_template_id,
         e.amount::float8 as amount, trim(e.currency) as currency, e.description,
         e.date_precision, e.occurred_on::text as occurred_on,
         e.period_start::text as period_start, e.period_end::text as period_end,
         c.name as category_name, c.kind as category_kind, c.classification,
         p.name as profile_name, p.color as profile_color
  from entries e
  join categories c on c.id = e.category_id
  join profiles p on p.id = e.profile_id
`;

/** Entries whose (possibly imprecise) period overlaps [start, end]. */
export async function getEntriesInRange(
  profileIds: string[] | null,
  start: string,
  end: string
): Promise<Entry[]> {
  return sql<Entry[]>`
    ${entrySelect}
    where e.period_start <= ${end} and e.period_end >= ${start}
    ${profileIds ? sql`and e.profile_id in ${sql(profileIds)}` : sql``}
    order by e.occurred_on desc, e.created_at desc
  `;
}

export interface LedgerFilters {
  profileIds: string[] | null;
  kind?: "income" | "expense";
  search?: string;
  limit?: number;
}

export async function getLedgerEntries(f: LedgerFilters): Promise<Entry[]> {
  return sql<Entry[]>`
    ${entrySelect}
    where true
    ${f.profileIds ? sql`and e.profile_id in ${sql(f.profileIds)}` : sql``}
    ${f.kind ? sql`and c.kind = ${f.kind}` : sql``}
    ${
      f.search
        ? sql`and (e.description ilike ${"%" + f.search + "%"} or c.name ilike ${"%" + f.search + "%"})`
        : sql``
    }
    order by e.occurred_on desc, e.created_at desc
    limit ${f.limit ?? 500}
  `;
}

export async function getTemplates(
  profileIds: string[] | null
): Promise<RecurringTemplate[]> {
  return sql<RecurringTemplate[]>`
    select t.id, t.profile_id, t.category_id, t.name,
           t.amount::float8 as amount, trim(t.currency) as currency,
           t.cadence, t.day_of_month, t.start_date::text as start_date,
           t.end_date::text as end_date, t.is_variable,
           t.amount_min::float8 as amount_min, t.amount_max::float8 as amount_max,
           c.name as category_name, c.kind as category_kind,
           p.name as profile_name, p.color as profile_color
    from recurring_templates t
    join categories c on c.id = t.category_id
    join profiles p on p.id = t.profile_id
    ${profileIds ? sql`where t.profile_id in ${sql(profileIds)}` : sql``}
    order by c.kind desc, t.amount desc
  `;
}
