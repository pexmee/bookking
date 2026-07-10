-- Rich demo data for marketing capture. Idempotent-ish: skips if entries exist.
DO $$
BEGIN
  IF (SELECT count(*) FROM entries) > 0 THEN
    RAISE NOTICE 'entries already exist, skipping seed';
    RETURN;
  END IF;

  UPDATE app_settings SET display_currency = 'USD';

  INSERT INTO profiles (name, color, sort_order)
  VALUES ('Business', '#2C3E50', 1);

  WITH personal AS (SELECT id FROM profiles WHERE name = 'Personal'),
       business AS (SELECT id FROM profiles WHERE name = 'Business')
  INSERT INTO categories (profile_id, name, kind, classification)
  SELECT p.id, c.name, c.kind::entry_kind, c.classification::category_classification
  FROM (VALUES
    ('Business', 'Client retainers', 'income', 'fixed_recurring'),
    ('Business', 'Consulting', 'income', 'variable_recurring'),
    ('Business', 'Software', 'expense', 'fixed_recurring'),
    ('Business', 'Contractors', 'expense', 'variable_recurring')
  ) AS c(profile, name, kind, classification)
  JOIN profiles p ON p.name = c.profile;

  -- Recurring templates
  INSERT INTO recurring_templates (profile_id, category_id, name, amount, currency, cadence, day_of_month, start_date, is_variable)
  SELECT p.id, c.id, t.name, t.amount, t.currency, t.cadence::cadence, t.dom, '2025-01-01', t.variable
  FROM (VALUES
    ('Personal', 'Salary', 'Monthly salary', 4200, 'EUR', 'monthly', 25, false),
    ('Personal', 'Rent', 'Apartment rent', 1500, 'EUR', 'monthly', 1, false),
    ('Personal', 'Utilities', 'Electricity', 95, 'EUR', 'monthly', 15, true),
    ('Personal', 'Subscriptions', 'Streaming bundle', 15, 'USD', 'monthly', 5, false),
    ('Business', 'Client retainers', 'Retainer - Acme Co', 3200, 'USD', 'monthly', 1, false),
    ('Business', 'Software', 'SaaS stack', 89, 'USD', 'monthly', 12, false)
  ) AS t(profile, cat, name, amount, currency, cadence, dom, variable)
  JOIN profiles p ON p.name = t.profile
  JOIN categories c ON c.profile_id = p.id AND c.name = t.cat;

  -- July 2026 entries (multi-currency)
  INSERT INTO entries (profile_id, category_id, recurring_template_id, amount, currency, description, date_precision, occurred_on)
  SELECT p.id, c.id, rt.id, e.amount, e.currency, e.description, e.prec::date_precision, e.occurred::date
  FROM (VALUES
    ('Personal', 'Salary', 'Monthly salary', 4200, 'EUR', 'July salary', 'day', '2026-07-25'),
    ('Personal', 'Rent', 'Apartment rent', 1500, 'EUR', 'July rent', 'day', '2026-07-01'),
    ('Personal', 'Utilities', 'Electricity', 118.40, 'EUR', 'July electricity', 'day', '2026-07-15'),
    ('Personal', 'Groceries', null, 86.20, 'EUR', 'Weekly shop', 'day', '2026-07-03'),
    ('Personal', 'Groceries', null, 74.55, 'EUR', 'Weekly shop', 'day', '2026-07-10'),
    ('Personal', 'Dining out', null, 62, 'USD', 'Team dinner', 'day', '2026-07-05'),
    ('Personal', 'Travel', null, 8400, 'SEK', 'Stockholm weekend', 'month', '2026-07-01'),
    ('Personal', 'Freelance', null, 950, 'USD', 'Logo project', 'month', '2026-07-01'),
    ('Personal', 'Health', null, 300, 'EUR', 'Annual dental checkup', 'year', '2026-01-01'),
    ('Business', 'Client retainers', 'Retainer - Acme Co', 3200, 'USD', 'July retainer', 'day', '2026-07-01'),
    ('Business', 'Consulting', null, 1800, 'USD', 'Workshop day rate', 'day', '2026-07-18'),
    ('Business', 'Software', 'SaaS stack', 89, 'USD', 'July SaaS', 'day', '2026-07-12'),
    ('Business', 'Contractors', null, 45000, 'THB', 'Bangkok design sprint', 'month', '2026-07-01')
  ) AS e(profile, cat, tmpl, amount, currency, description, prec, occurred)
  JOIN profiles p ON p.name = e.profile
  JOIN categories c ON c.profile_id = p.id AND c.name = e.cat
  LEFT JOIN recurring_templates rt ON rt.profile_id = p.id AND rt.name = e.tmpl;

END $$;
