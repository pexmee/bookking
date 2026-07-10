import { startOfDay } from "date-fns";
import { sql } from "./db";
import { occurrenceDatesUpTo } from "./projections";
import type { RecurringTemplate } from "./types";

/** Create ledger rows for recurring templates due through today. Idempotent. */
export async function materializeRecurringEntries(): Promise<void> {
  const today = startOfDay(new Date());

  const [templates, existing, skips] = await Promise.all([
    sql<RecurringTemplate[]>`
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
    `,
    sql<{ recurring_template_id: string; occurred_on: string }[]>`
      select recurring_template_id, occurred_on::text as occurred_on
      from entries
      where recurring_template_id is not null
    `,
    sql<{ template_id: string; occurred_on: string }[]>`
      select template_id, occurred_on::text as occurred_on
      from recurring_skips
    `,
  ]);

  const existingKeys = new Set(
    existing.map((r) => `${r.recurring_template_id}:${r.occurred_on}`)
  );
  const skipKeys = new Set(skips.map((s) => `${s.template_id}:${s.occurred_on}`));

  for (const t of templates) {
    for (const occurredOn of occurrenceDatesUpTo(t, today)) {
      const key = `${t.id}:${occurredOn}`;
      if (existingKeys.has(key) || skipKeys.has(key)) continue;

      await sql`
        insert into entries (profile_id, category_id, recurring_template_id,
                             amount, currency, description, date_precision, occurred_on)
        values (${t.profile_id}, ${t.category_id}, ${t.id}, ${t.amount},
                ${t.currency}, ${t.name}, 'day', ${occurredOn})
        on conflict (recurring_template_id, occurred_on)
          where recurring_template_id is not null
        do nothing
      `;
      existingKeys.add(key);
    }
  }
}
