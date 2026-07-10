import { formatMoney } from "@/lib/money";

export interface VarianceRow {
  name: string;
  kind: "income" | "expense";
  projected: number;
  actual: number;
}

/**
 * Projected vs actual per recurring category. Projection is the hollow bar,
 * the actual fills it; overshoot spills past the projection mark.
 */
export function VarianceBars({
  rows,
  currency,
}: {
  rows: VarianceRow[];
  currency: string;
}) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => Math.max(r.projected, r.actual)), 1);

  return (
    <div className="variance">
      {rows.map((r) => {
        const projPct = (r.projected / max) * 100;
        const actPct = (r.actual / max) * 100;
        const delta = r.actual - r.projected;
        const over = r.kind === "expense" ? delta > 0.005 : delta < -0.005;
        return (
          <div key={`${r.kind}-${r.name}`} className="variance__row">
            <div className="variance__head">
              <span>{r.name}</span>
              <span className={`money ${over ? "money--deficit" : ""}`} style={{ fontSize: "0.8125rem" }}>
                {formatMoney(r.actual, currency)}
                <span style={{ color: "var(--ink-faint)" }}>
                  {" / "}
                  {formatMoney(r.projected, currency)}
                </span>
              </span>
            </div>
            <div className="variance__track">
              <div
                className="variance__projected"
                style={{ width: `${projPct}%` }}
                title={`Projected ${formatMoney(r.projected, currency)}`}
              />
              <div
                className="variance__actual"
                style={{
                  width: `${Math.min(actPct, 100)}%`,
                  background: over
                    ? "var(--wine)"
                    : r.kind === "income"
                      ? "var(--copper)"
                      : "var(--slate)",
                }}
                title={`Actual ${formatMoney(r.actual, currency)}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
