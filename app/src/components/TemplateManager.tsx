"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createEntry,
  createTemplate,
  deleteTemplate,
  type TemplateInput,
} from "@/lib/actions";
import { CURRENCIES, formatMoney } from "@/lib/money";
import type {
  Cadence,
  Category,
  EntryKind,
  Profile,
  RecurringTemplate,
} from "@/lib/types";

const CADENCES: { value: Cadence; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Props {
  templates: RecurringTemplate[];
  profiles: Profile[];
  categories: Category[];
  defaultCurrency: string;
  /** template id -> projected amount for the current month, display currency */
  monthlyProjection: Record<string, number | null>;
  displayCurrency: string;
}

export function TemplateManager({
  templates,
  profiles,
  categories,
  defaultCurrency,
  monthlyProjection,
  displayCurrency,
}: Props) {
  const income = templates.filter((t) => t.category_kind === "income");
  const expense = templates.filter((t) => t.category_kind === "expense");

  return (
    <>
      <TemplateForm
        profiles={profiles}
        categories={categories}
        defaultCurrency={defaultCurrency}
      />

      <TemplateGroup
        title="Recurring income"
        templates={income}
        monthlyProjection={monthlyProjection}
        displayCurrency={displayCurrency}
        emptyCopy="No recurring income yet. A salary or retainer belongs here."
      />
      <TemplateGroup
        title="Recurring expenses"
        templates={expense}
        monthlyProjection={monthlyProjection}
        displayCurrency={displayCurrency}
        emptyCopy="No recurring expenses yet. Rent, utilities and subscriptions belong here."
      />
    </>
  );
}

function TemplateGroup({
  title,
  templates,
  monthlyProjection,
  displayCurrency,
  emptyCopy,
}: {
  title: string;
  templates: RecurringTemplate[];
  monthlyProjection: Record<string, number | null>;
  displayCurrency: string;
  emptyCopy: string;
}) {
  const monthlyTotal = templates.reduce(
    (s, t) => s + (monthlyProjection[t.id] ?? 0),
    0
  );
  return (
    <div className="panel section">
      <div className="panel__body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2>{title}</h2>
          {templates.length > 0 && (
            <span className="fx-note">
              ≈ {formatMoney(monthlyTotal, displayCurrency)} projected this month
            </span>
          )}
        </div>
        {templates.length === 0 ? (
          <p className="empty-state">{emptyCopy}</p>
        ) : (
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Cadence</th>
                <th className="num">Expected</th>
                <th className="num">This month</th>
                <th style={{ width: 200 }} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  projected={monthlyProjection[t.id] ?? null}
                  displayCurrency={displayCurrency}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TemplateRow({
  template: t,
  projected,
  displayCurrency,
}: {
  template: RecurringTemplate;
  projected: number | null;
  displayCurrency: string;
}) {
  const [logging, setLogging] = useState(false);
  const [amount, setAmount] = useState(String(t.amount));
  const [date, setDate] = useState(today());
  const [pending, startTransition] = useTransition();

  function logActual() {
    startTransition(async () => {
      const result = await createEntry({
        profileId: t.profile_id,
        categoryId: t.category_id,
        amount: parseFloat(amount.replace(",", ".")),
        currency: t.currency,
        description: t.name,
        datePrecision: "day",
        occurredOn: date,
        recurringTemplateId: t.id,
      });
      if (!result?.error) setLogging(false);
    });
  }

  return (
    <>
      <tr>
        <td>
          <span
            className="pill-dot"
            style={{ background: t.profile_color, marginRight: 6 }}
          />
          {t.name}
          {t.is_variable && (
            <span className="fx-note" title="Amount varies period to period">
              {" "}
              · variable
            </span>
          )}
        </td>
        <td>{t.category_name}</td>
        <td style={{ color: "var(--ink-muted)" }}>
          {CADENCES.find((c) => c.value === t.cadence)?.label}
          {t.day_of_month ? ` · day ${t.day_of_month}` : ""}
        </td>
        <td className="num money">
          {formatMoney(Number(t.amount), t.currency)}
          {t.is_variable && t.amount_min !== null && t.amount_max !== null && (
            <div className="fx-note">
              {formatMoney(t.amount_min, t.currency)}–{formatMoney(t.amount_max, t.currency)}
            </div>
          )}
        </td>
        <td className="num money" style={{ color: "var(--ink-muted)" }}>
          {projected !== null ? `≈ ${formatMoney(projected, displayCurrency)}` : "—"}
        </td>
        <td className="num" style={{ whiteSpace: "nowrap" }}>
          <button
            className="btn btn--ghost btn--small"
            onClick={() => setLogging((v) => !v)}
          >
            {logging ? "Cancel" : "Log actual"}
          </button>{" "}
          <button
            className="row-delete"
            aria-label={`Delete template ${t.name}`}
            title="Delete template (logged entries are kept)"
            onClick={() => startTransition(() => deleteTemplate(t.id))}
          >
            ×
          </button>
        </td>
      </tr>
      {logging && (
        <tr>
          <td colSpan={6} style={{ background: "var(--surface-sunken)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", padding: "4px 0" }}>
              <div className="field" style={{ width: 130 }}>
                <span className="label">Actual amount ({t.currency})</span>
                <input
                  className="input money"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="field" style={{ width: 150 }}>
                <span className="label">Date</span>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <button className="btn btn--small" disabled={pending} onClick={logActual}>
                {pending ? "Logging…" : `Log ${t.name}`}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TemplateForm({
  profiles,
  categories,
  defaultCurrency,
}: {
  profiles: Profile[];
  categories: Category[];
  defaultCurrency: string;
}) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [isVariable, setIsVariable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.profile_id === profileId && c.kind === kind),
    [categories, profileId, kind]
  );
  const effectiveCategory = categoryOptions.some((c) => c.id === categoryId)
    ? categoryId
    : (categoryOptions[0]?.id ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: TemplateInput = {
      profileId,
      categoryId: effectiveCategory,
      name,
      amount: parseFloat(amount.replace(",", ".")),
      currency,
      cadence,
      dayOfMonth: dayOfMonth ? Number(dayOfMonth) : null,
      startDate,
      endDate: null,
      isVariable,
      amountMin: null,
      amountMax: null,
    };
    startTransition(async () => {
      const result = await createTemplate(input);
      if (result?.error) setError(result.error);
      else {
        setName("");
        setAmount("");
      }
    });
  }

  return (
    <form className="quick-add panel" onSubmit={submit}>
      <div className="field">
        <span className="label">Type</span>
        <div className="quick-add__kind">
          <button
            type="button"
            className={kind === "expense" ? "is-active--expense" : ""}
            onClick={() => setKind("expense")}
          >
            Expense
          </button>
          <button
            type="button"
            className={kind === "income" ? "is-active--income" : ""}
            onClick={() => setKind("income")}
          >
            Income
          </button>
        </div>
      </div>

      <div className="field" style={{ flex: "1 1 140px" }}>
        <label className="label" htmlFor="tf-name">
          Name
        </label>
        <input
          id="tf-name"
          className="input"
          placeholder="e.g. Rent, Salary, Gym…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="field" style={{ width: 110 }}>
        <label className="label" htmlFor="tf-amount">
          Expected
        </label>
        <input
          id="tf-amount"
          className="input money"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="field" style={{ width: 84 }}>
        <label className="label" htmlFor="tf-currency">
          Currency
        </label>
        <select
          id="tf-currency"
          className="select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field" style={{ width: 120 }}>
        <label className="label" htmlFor="tf-cadence">
          Cadence
        </label>
        <select
          id="tf-cadence"
          className="select"
          value={cadence}
          onChange={(e) => setCadence(e.target.value as Cadence)}
        >
          {CADENCES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {cadence !== "weekly" && (
        <div className="field" style={{ width: 90 }}>
          <label className="label" htmlFor="tf-day">
            Day of month
          </label>
          <input
            id="tf-day"
            type="number"
            min={1}
            max={31}
            className="input money"
            placeholder="1"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </div>
      )}

      <div className="field" style={{ width: 150 }}>
        <label className="label" htmlFor="tf-start">
          Starts
        </label>
        <input
          id="tf-start"
          type="date"
          className="input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="field" style={{ width: 160 }}>
        <label className="label" htmlFor="tf-category">
          Category
        </label>
        <select
          id="tf-category"
          className="select"
          value={effectiveCategory}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {profiles.length > 1 && (
        <div className="field" style={{ width: 130 }}>
          <label className="label" htmlFor="tf-profile">
            Profile
          </label>
          <select
            id="tf-profile"
            className="select"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <label
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", paddingBottom: 8 }}
      >
        <input
          type="checkbox"
          checked={isVariable}
          onChange={(e) => setIsVariable(e.target.checked)}
        />
        Amount varies
      </label>

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save template"}
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
