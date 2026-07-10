"use client";

import { useState, useTransition } from "react";
import { refreshRatesNow, updateSettings } from "@/lib/actions";
import { CURRENCIES } from "@/lib/money";
import type { Settings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [currency, setCurrency] = useState(settings.display_currency);
  const [staleHours, setStaleHours] = useState(String(settings.fx_stale_hours));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateSettings(currency, Math.max(1, Number(staleHours) || 24));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form className="quick-add panel" onSubmit={submit}>
      <div className="field" style={{ width: 180 }}>
        <label className="label" htmlFor="st-currency">
          Display currency
        </label>
        <select
          id="st-currency"
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
        <label className="label" htmlFor="st-stale">
          Refresh rates after (hours)
        </label>
        <input
          id="st-stale"
          type="number"
          min={1}
          className="input money"
          value={staleHours}
          onChange={(e) => setStaleHours(e.target.value)}
        />
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </button>
      <button
        className="btn btn--ghost"
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => refreshRatesNow())}
      >
        Fetch fresh rates now
      </button>
    </form>
  );
}
