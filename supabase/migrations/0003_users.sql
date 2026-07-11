-- Per-login-user isolation. Auth usernames map to book_users rows; all ledger
-- data is scoped through profiles.user_id.

create table if not exists book_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists user_id uuid references book_users(id) on delete cascade;

create index if not exists profiles_user_idx on profiles (user_id);

-- Replace singleton app_settings with per-user settings.
create table if not exists app_settings_per_user (
  user_id uuid primary key references book_users(id) on delete cascade,
  display_currency char(3) not null default 'USD',
  theme text not null default 'light',
  fx_stale_hours int not null default 24
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'app_settings'
      and exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'app_settings'
          and column_name = 'id'
      )
  ) then
    drop table app_settings;
  end if;
end $$;

alter table if exists app_settings_per_user rename to app_settings;
