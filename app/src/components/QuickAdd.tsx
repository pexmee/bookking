"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createEntry } from "@/lib/actions";
import { CURRENCIES } from "@/lib/money";
import type { Category, DatePrecision, EntryKind, Profile } from "@/lib/types";

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface Props {
  profiles: Profile[];
  categories: Category[];
  defaultCurrency: string;
  /** profile id from the active filter, or "all" */
  activeProfile: string;
}

export function QuickAdd({ profiles, categories, defaultCurrency, activeProfile }: Props) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [profileId, setProfileId] = useState(
    activeProfile !== "all" ? activeProfile : (profiles[0]?.id ?? "")
  );
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [description, setDescription] = useState("");
  const [precision, setPrecision] = useState<DatePrecision>("day");
  const [dateValue, setDateValue] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.profile_id === profileId && c.kind === kind),
    [categories, profileId, kind]
  );
  const effectiveCategory = categoryOptions.some((c) => c.id === categoryId)
    ? categoryId
    : (categoryOptions[0]?.id ?? "");

  // "n" focuses the amount field from anywhere outside an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        amountRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function anchorDate(): string {
    if (precision === "day") return dateValue;
    if (precision === "month") return `${dateValue}-01`;
    return `${dateValue}-01-01`;
  }

  function switchPrecision(p: DatePrecision) {
    setPrecision(p);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    if (p === "day") setDateValue(today());
    else if (p === "month") setDateValue(`${now.getFullYear()}-${pad(now.getMonth() + 1)}`);
    else setDateValue(String(now.getFullYear()));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseFloat(amount.replace(",", "."));
    if (!profileId || !effectiveCategory) {
      setError("Pick a profile and category first.");
      return;
    }
    startTransition(async () => {
      const result = await createEntry({
        profileId,
        categoryId: effectiveCategory,
        amount: parsed,
        currency,
        description,
        datePrecision: precision,
        occurredOn: anchorDate(),
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setAmount("");
        setDescription("");
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        amountRef.current?.focus();
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

      <div className="field" style={{ width: 110 }}>
        <label className="label" htmlFor="qa-amount">
          Amount
        </label>
        <input
          id="qa-amount"
          ref={amountRef}
          className="input money"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div className="field" style={{ width: 84 }}>
        <label className="label" htmlFor="qa-currency">
          Currency
        </label>
        <select
          id="qa-currency"
          className="select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field" style={{ width: 160 }}>
        <label className="label" htmlFor="qa-category">
          Category
        </label>
        <select
          id="qa-category"
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

      <div className="field" style={{ flex: "1 1 140px" }}>
        <label className="label" htmlFor="qa-desc">
          Note
        </label>
        <input
          id="qa-desc"
          className="input"
          placeholder="e.g. July rent, brake pads…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field">
        <span className="label">Date precision</span>
        <div className="precision-toggle">
          {(["day", "month", "year"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={precision === p ? "is-active" : ""}
              onClick={() => switchPrecision(p)}
            >
              {p === "day" ? "Day" : p === "month" ? "Month" : "Year"}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ width: precision === "year" ? 90 : 150 }}>
        <label className="label" htmlFor="qa-date">
          When
        </label>
        {precision === "day" && (
          <input
            id="qa-date"
            type="date"
            className="input"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            required
          />
        )}
        {precision === "month" && (
          <input
            id="qa-date"
            type="month"
            className="input"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            required
          />
        )}
        {precision === "year" && (
          <input
            id="qa-date"
            type="number"
            className="input money"
            min={1970}
            max={2100}
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            required
          />
        )}
      </div>

      {profiles.length > 1 && (
        <div className="field" style={{ width: 130 }}>
          <label className="label" htmlFor="qa-profile">
            Profile
          </label>
          <select
            id="qa-profile"
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

      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Adding…" : saved ? "Added ✓" : "Add entry"}
      </button>

      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
