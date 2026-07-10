import { formatMoney } from "@/lib/money";

export interface BreakdownRow {
  name: string;
  value: number;
  color?: string;
}

/** Horizontal bar list with a tabular legend — no donut, exact figures. */
export function Breakdown({
  rows,
  total,
  currency,
  barColor = "var(--slate)",
}: {
  rows: BreakdownRow[];
  total: number;
  currency: string;
  barColor?: string;
}) {
  if (rows.length === 0 || total <= 0) return null;
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <div className="breakdown">
      {rows.map((r) => (
        <div key={r.name} className="breakdown__row">
          <span className="breakdown__name">{r.name}</span>
          <div className="breakdown__track">
            <div
              className="breakdown__bar"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? barColor }}
            />
          </div>
          <span className="money breakdown__value">{formatMoney(r.value, currency)}</span>
          <span className="breakdown__pct">
            {((r.value / total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}
