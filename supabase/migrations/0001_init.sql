-- Bookking schema. Runs on first database start (docker-entrypoint-initdb.d)
-- and via `supabase db reset` during development.

create extension if not exists pgcrypto;

-- PostgREST compatibility role (read-only REST layer of the trimmed Supabase stack)
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end $$;

create type entry_kind as enum ('income', 'expense');
create type category_classification as enum ('fixed_recurring', 'variable_recurring', 'discretionary', 'irregular');
create type cadence as enum ('weekly', 'monthly', 'quarterly', 'yearly');
create type date_precision as enum ('day', 'month', 'year');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6B7F6A',
  icon text,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  kind entry_kind not null,
  classification category_classification not null,
  created_at timestamptz not null default now(),
  unique (profile_id, kind, name)
);

create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  amount numeric(19,4) not null check (amount >= 0),
  currency char(3) not null,
  cadence cadence not null default 'monthly',
  day_of_month int check (day_of_month between 1 and 31),
  start_date date not null default current_date,
  end_date date,
  is_variable boolean not null default false,
  amount_min numeric(19,4) check (amount_min >= 0),
  amount_max numeric(19,4) check (amount_max >= 0),
  created_at timestamptz not null default now()
);

-- Period bounds derived from an anchor date + precision. Immutable so they can
-- back generated columns.
create or replace function entry_period_start(d date, p date_precision)
returns date language sql immutable as $$
  select case p
    when 'day' then d
    when 'month' then make_date(extract(year from d)::int, extract(month from d)::int, 1)
    else make_date(extract(year from d)::int, 1, 1)
  end
$$;

create or replace function entry_period_end(d date, p date_precision)
returns date language sql immutable as $$
  select case p
    when 'day' then d
    when 'month' then (make_date(extract(year from d)::int, extract(month from d)::int, 1)
                       + interval '1 month' - interval '1 day')::date
    else make_date(extract(year from d)::int, 12, 31)
  end
$$;

create table entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  recurring_template_id uuid references recurring_templates(id) on delete set null,
  amount numeric(19,4) not null check (amount >= 0),
  currency char(3) not null,
  description text not null default '',
  date_precision date_precision not null default 'day',
  occurred_on date not null,
  period_start date not null generated always as (entry_period_start(occurred_on, date_precision)) stored,
  period_end date not null generated always as (entry_period_end(occurred_on, date_precision)) stored,
  created_at timestamptz not null default now()
);

create index entries_profile_period_idx on entries (profile_id, period_start, period_end);
create index entries_category_idx on entries (category_id);
create index entries_template_idx on entries (recurring_template_id);

-- FX cache: all rates stored against EUR (Frankfurter/ECB base).
create table exchange_rates (
  base_currency char(3) not null,
  target_currency char(3) not null,
  rate numeric(18,8) not null check (rate > 0),
  fetched_at timestamptz not null default now(),
  source text not null default 'ecb/frankfurter',
  primary key (base_currency, target_currency)
);

create table app_settings (
  id boolean primary key default true check (id),
  display_currency char(3) not null default 'USD',
  theme text not null default 'light',
  fx_stale_hours int not null default 24
);

grant usage on schema public to anon;
grant select on all tables in schema public to anon;

-- Seed: one starter profile with sensible categories. (The app_settings row is
-- created lazily by the app so DEFAULT_DISPLAY_CURRENCY from the environment
-- becomes the initial display currency.)
with p as (
  insert into profiles (name, color, sort_order) values ('Personal', '#6B7F6A', 0)
  returning id
)
insert into categories (profile_id, name, kind, classification)
select p.id, c.name, c.kind::entry_kind, c.classification::category_classification
from p, (values
  ('Salary',        'income',  'fixed_recurring'),
  ('Freelance',     'income',  'variable_recurring'),
  ('Other income',  'income',  'irregular'),
  ('Rent',          'expense', 'fixed_recurring'),
  ('Subscriptions', 'expense', 'fixed_recurring'),
  ('Utilities',     'expense', 'variable_recurring'),
  ('Groceries',     'expense', 'variable_recurring'),
  ('Transport',     'expense', 'variable_recurring'),
  ('Dining out',    'expense', 'discretionary'),
  ('Entertainment', 'expense', 'discretionary'),
  ('Travel',        'expense', 'irregular'),
  ('Health',        'expense', 'irregular'),
  ('Other',         'expense', 'irregular')
) as c(name, kind, classification);
