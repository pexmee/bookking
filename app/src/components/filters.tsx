"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Profile } from "@/lib/types";
import type { Period, PeriodScope } from "@/lib/dates";
import { periodKeyForScope } from "@/lib/dates";

function useSetParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );
}

export function ProfileFilter({
  profiles,
  active,
}: {
  profiles: Profile[];
  active: string; // "all" or profile id
}) {
  const setParam = useSetParam();
  return (
    <div className="profile-filter" role="group" aria-label="Profile filter">
      <button
        className={`profile-filter__pill${active === "all" ? " is-active" : ""}`}
        onClick={() => setParam({ profile: null })}
      >
        All profiles
      </button>
      {profiles.map((p) => (
        <button
          key={p.id}
          className={`profile-filter__pill${active === p.id ? " is-active" : ""}`}
          onClick={() => setParam({ profile: p.id })}
        >
          <span className="pill-dot" style={{ background: p.color }} />
          {p.name}
        </button>
      ))}
    </div>
  );
}

const SCOPES: { value: PeriodScope; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
];

export function PeriodSelector({ period }: { period: Period }) {
  const setParam = useSetParam();
  return (
    <div className="period-selector">
      <div className="period-selector__scopes" role="group" aria-label="Period scope">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            className={`period-selector__scope${period.scope === s.value ? " is-active" : ""}`}
            onClick={() => setParam({ period: periodKeyForScope(period, s.value) })}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="period-selector__nav">
        <button
          className="period-selector__arrow"
          aria-label="Previous period"
          onClick={() => setParam({ period: period.prevKey })}
        >
          ←
        </button>
        <span className="period-selector__label">{period.label}</span>
        <button
          className="period-selector__arrow"
          aria-label="Next period"
          onClick={() => setParam({ period: period.nextKey })}
        >
          →
        </button>
      </div>
    </div>
  );
}
