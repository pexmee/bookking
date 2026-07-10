import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyLink,
  type SankeyNode,
} from "d3-sankey";
import { formatMoneyCompact } from "@/lib/money";

export interface FlowInput {
  /** income category name -> converted amount */
  income: { name: string; value: number }[];
  /** expense category name -> converted amount */
  expense: { name: string; value: number }[];
  currency: string;
}

interface NodeDatum {
  name: string;
  side: "in" | "mid" | "out" | "kept" | "deficit";
}
type N = SankeyNode<NodeDatum, object>;
type L = SankeyLink<NodeDatum, object>;

const FILL: Record<NodeDatum["side"], string> = {
  in: "var(--copper)",
  mid: "var(--ink)",
  out: "var(--slate)",
  kept: "var(--sage)",
  deficit: "var(--wine)",
};

/**
 * Income sources flow into the period, then out to spending categories.
 * A surplus leaves as "Kept"; a shortfall enters as "Drawn from reserves".
 */
export function SankeyChart({ income, expense, currency }: FlowInput) {
  const totalIn = income.reduce((s, d) => s + d.value, 0);
  const totalOut = expense.reduce((s, d) => s + d.value, 0);
  if (totalIn === 0 && totalOut === 0) return null;

  const nodes: NodeDatum[] = [];
  const links: { source: number; target: number; value: number }[] = [];
  const idx = (n: NodeDatum) => nodes.push(n) - 1;

  const midIdx = idx({ name: "This period", side: "mid" });

  for (const d of income) {
    if (d.value <= 0) continue;
    links.push({ source: idx({ name: d.name, side: "in" }), target: midIdx, value: d.value });
  }
  if (totalOut > totalIn) {
    links.push({
      source: idx({ name: "Drawn from reserves", side: "deficit" }),
      target: midIdx,
      value: totalOut - totalIn,
    });
  }
  for (const d of expense) {
    if (d.value <= 0) continue;
    links.push({ source: midIdx, target: idx({ name: d.name, side: "out" }), value: d.value });
  }
  if (totalIn > totalOut) {
    links.push({
      source: midIdx,
      target: idx({ name: "Kept", side: "kept" }),
      value: totalIn - totalOut,
    });
  }

  const W = 760;
  const H = Math.max(260, 34 * Math.max(income.length, expense.length + 1));

  const layout = sankey<NodeDatum, object>()
    .nodeWidth(6)
    .nodePadding(14)
    .extent([
      [170, 8],
      [W - 170, H - 8],
    ]);

  const graph: SankeyGraph<NodeDatum, object> = layout({
    nodes: nodes.map((n) => ({ ...n })),
    links: links.map((l) => ({ ...l })),
  });

  const path = sankeyLinkHorizontal<NodeDatum, object>();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Where money came from and where it went"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {graph.links.map((l, i) => {
        const link = l as L;
        const target = link.target as N;
        const source = link.source as N;
        const hue = target.side === "mid" ? FILL[source.side] : FILL[target.side];
        return (
          <path
            key={i}
            d={path(link) ?? undefined}
            fill="none"
            stroke={hue}
            strokeOpacity={0.28}
            strokeWidth={Math.max(1, link.width ?? 1)}
          >
            <title>{`${source.name} → ${target.name}: ${formatMoneyCompact(link.value ?? 0, currency)}`}</title>
          </path>
        );
      })}
      {graph.nodes.map((n, i) => {
        const node = n as N;
        const x0 = node.x0 ?? 0;
        const x1 = node.x1 ?? 0;
        const y0 = node.y0 ?? 0;
        const y1 = node.y1 ?? 0;
        const isLeft = node.side === "in" || node.side === "deficit";
        const value = node.value ?? 0;
        return (
          <g key={i}>
            <rect
              x={x0}
              y={y0}
              width={x1 - x0}
              height={Math.max(1, y1 - y0)}
              fill={FILL[node.side]}
            >
              <title>{`${node.name}: ${formatMoneyCompact(value, currency)}`}</title>
            </rect>
            {node.side !== "mid" && (
              <text
                x={isLeft ? x0 - 8 : x1 + 8}
                y={(y0 + y1) / 2}
                dominantBaseline="middle"
                textAnchor={isLeft ? "end" : "start"}
                fontSize="11.5"
                fill="var(--ink)"
                fontFamily="var(--font-ui)"
              >
                {node.name}
                <tspan fill="var(--ink-faint)" fontFamily="var(--font-mono)">
                  {"  "}
                  {formatMoneyCompact(value, currency)}
                </tspan>
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
