-- One ledger row per template occurrence. Supports idempotent auto-materialization.
create unique index if not exists entries_template_occurrence_idx
  on entries (recurring_template_id, occurred_on)
  where recurring_template_id is not null;

-- When a user deletes an auto-generated row, suppress re-materialization for that date.
create table if not exists recurring_skips (
  template_id uuid not null references recurring_templates(id) on delete cascade,
  occurred_on date not null,
  created_at timestamptz not null default now(),
  primary key (template_id, occurred_on)
);
