import { formatDistanceToNowStrict } from "date-fns";
import { Breakdown } from "@/components/charts/Breakdown";
import { CashFlowChart } from "@/components/charts/CashFlow";
import { SankeyChart } from "@/components/charts/Sankey";
import { VarianceBars } from "@/components/charts/VarianceBars";
import { PeriodSelector, ProfileFilter } from "@/components/filters";
import { QuickAdd } from "@/components/QuickAdd";
import {
  bucketize,
  byCategory,
  convertEntries,
  sumByKind,
  varianceRows,
} from "@/lib/aggregate";
import { isoDate, parsePeriod } from "@/lib/dates";
import { getRates } from "@/lib/fx";
import { formatMoney } from "@/lib/money";
import { projectTemplates } from "@/lib/projections";
import {
  getCategories,
  getEntriesInRange,
  getProfiles,
  getSettings,
  getTemplates,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; profile?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const activeProfile = sp.profile ?? "all";
  const profileIds = activeProfile === "all" ? null : [activeProfile];

  const settings = await getSettings();
  const [rates, profiles, categories, entries, templates] = await Promise.all([
    getRates(settings.fx_stale_hours),
    getProfiles(),
    getCategories(null),
    getEntriesInRange(profileIds, isoDate(period.start), isoDate(period.end)),
    getTemplates(profileIds),
  ]);

  const display = settings.display_currency;
  const converted = convertEntries(entries, display, rates);
  const totals = sumByKind(converted);
  const buckets = bucketize(converted, period);
  const incomeFlows = byCategory(converted, "income");
  const expenseFlows = byCategory(converted, "expense");
  const projections = projectTemplates(
    templates,
    period.start,
    period.end,
    display,
    rates
  );
  const projectedIn = projections
    .filter((p) => p.template.category_kind === "income")
    .reduce((s, p) => s + (p.projectedDisplay ?? 0), 0);
  const projectedOut = projections
    .filter((p) => p.template.category_kind === "expense")
    .reduce((s, p) => s + (p.projectedDisplay ?? 0), 0);
  const variance = varianceRows(projections, converted);

  const hasAnything = entries.length > 0;
  const fxAge = rates.fetchedAt
    ? formatDistanceToNowStrict(rates.fetchedAt, { addSuffix: true })
    : null;

  return (
    <>
      <div className="page-head">
        <h1>Overview</h1>
        <PeriodSelector period={period} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ProfileFilter profiles={profiles} active={activeProfile} />
      </div>

      <QuickAdd
        profiles={profiles}
        categories={categories}
        defaultCurrency={display}
        activeProfile={activeProfile}
      />

      <div className="overview-grid" style={{ marginTop: 20 }}>
        <div>
          <div className="panel">
            <div className="panel__body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h2>Cash flow</h2>
                <span className="fx-note">
                  income above the line · spending below
                </span>
              </div>
              {hasAnything ? (
                <div style={{ marginTop: 12 }}>
                  <CashFlowChart buckets={buckets} currency={display} />
                </div>
              ) : (
                <p className="empty-state">
                  Nothing recorded for {period.label} yet. Add the first entry
                  above — it takes ten seconds.
                </p>
              )}
            </div>
          </div>

          {(incomeFlows.length > 0 || expenseFlows.length > 0) && (
            <div className="panel section">
              <div className="panel__body">
                <h2>Where it went</h2>
                <div style={{ marginTop: 12 }}>
                  <SankeyChart
                    income={incomeFlows}
                    expense={expenseFlows}
                    currency={display}
                  />
                </div>
              </div>
            </div>
          )}

          {variance.length > 0 && (
            <div className="panel section">
              <div className="panel__body">
                <h2>Projected vs actual</h2>
                <p className="stat__sub" style={{ marginBottom: 14 }}>
                  Recurring categories only. The outline marks the projection;
                  the fill is what actually happened.
                </p>
                <VarianceBars rows={variance} currency={display} />
              </div>
            </div>
          )}
        </div>

        <div className="overview-rail">
          <div className="panel stat">
            <span className="label">Income · {period.label}</span>
            <div className="stat__value money--in total-morph">
              {formatMoney(totals.income, display)}
            </div>
            <div className="stat__sub">
              projected {formatMoney(projectedIn, display)}
            </div>
          </div>
          <div className="panel stat">
            <span className="label">Spending · {period.label}</span>
            <div className="stat__value money--out total-morph">
              {formatMoney(totals.expense, display)}
            </div>
            <div className="stat__sub">
              projected {formatMoney(projectedOut, display)}
            </div>
          </div>
          <div className="panel stat">
            <span className="label">Net</span>
            <div
              className={`stat__value total-morph ${totals.net < 0 ? "money--deficit" : ""}`}
            >
              {formatMoney(totals.net, display)}
            </div>
            <div className="stat__sub">
              {totals.net >= 0 ? "kept this period" : "drawn from reserves"}
              {totals.unconverted > 0 &&
                ` · ${totals.unconverted} entr${totals.unconverted === 1 ? "y" : "ies"} missing an FX rate`}
            </div>
          </div>

          {expenseFlows.length > 0 && (
            <div className="panel">
              <div className="panel__body">
                <span className="label">Spending by category</span>
                <div style={{ marginTop: 12 }}>
                  <Breakdown
                    rows={expenseFlows.slice(0, 8)}
                    total={totals.expense}
                    currency={display}
                  />
                </div>
              </div>
            </div>
          )}

          <p className="fx-note">
            {fxAge
              ? `≈ converted to ${display} · rates from ECB · updated ${fxAge}`
              : `FX rates unavailable — amounts in ${display} only`}
          </p>
        </div>
      </div>
    </>
  );
}
