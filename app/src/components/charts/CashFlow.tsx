import { formatMoneyCompact } from "@/lib/money";

export interface CashFlowBucket {
  label: string;
  income: number;
  expense: number;
}

/**
 * Mirrored bar chart: income rises in copper, spending hangs in slate.
 * Pure SVG, sized by viewBox so it scales with its panel.
 */
export function CashFlowChart({
  buckets,
  currency,
}: {
  buckets: CashFlowBucket[];
  currency: string;
}) {
  const W = 760;
  const H = 300;
  const padX = 8;
  const padY = 24;
  const mid = H / 2;

  const max = Math.max(
    1,
    ...buckets.map((b) => Math.max(b.income, b.expense))
  );
  const scale = (v: number) => (v / max) * (mid - padY);

  const n = buckets.length;
  const slot = (W - padX * 2) / Math.max(1, n);
  const barW = Math.max(3, Math.min(28, slot * 0.6));

  const showEvery = n > 16 ? Math.ceil(n / 12) : 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Cash flow: income above the line, spending below"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* baseline */}
      <line x1={padX} y1={mid} x2={W - padX} y2={mid} stroke="var(--line-strong)" strokeWidth="1" />

      {buckets.map((b, i) => {
        const cx = padX + slot * i + slot / 2;
        return (
          <g key={i}>
            {b.income > 0 && (
              <rect
                x={cx - barW / 2}
                y={mid - scale(b.income)}
                width={barW}
                height={scale(b.income)}
                fill="var(--copper)"
              >
                <title>{`${b.label} — income ${formatMoneyCompact(b.income, currency)}`}</title>
              </rect>
            )}
            {b.expense > 0 && (
              <rect
                x={cx - barW / 2}
                y={mid}
                width={barW}
                height={scale(b.expense)}
                fill="var(--slate)"
              >
                <title>{`${b.label} — spent ${formatMoneyCompact(b.expense, currency)}`}</title>
              </rect>
            )}
            {i % showEvery === 0 && (
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ink-faint)"
                fontFamily="var(--font-mono)"
              >
                {b.label}
              </text>
            )}
          </g>
        );
      })}

      {/* scale hint */}
      <text x={padX} y={14} fontSize="10" fill="var(--ink-faint)" fontFamily="var(--font-mono)">
        {formatMoneyCompact(max, currency)}
      </text>
    </svg>
  );
}
