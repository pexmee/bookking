import type { Metadata } from "next";
import { ProfileFilter } from "@/components/filters";
import { TemplateManager } from "@/components/TemplateManager";
import { parsePeriod } from "@/lib/dates";
import { getRates } from "@/lib/fx";
import { projectTemplates } from "@/lib/projections";
import {
  getCategories,
  getProfiles,
  getSettings,
  getTemplates,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recurring" };

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const sp = await searchParams;
  const activeProfile = sp.profile ?? "all";
  const profileIds = activeProfile === "all" ? null : [activeProfile];

  const settings = await getSettings();
  const [rates, profiles, categories, templates] = await Promise.all([
    getRates(settings.fx_stale_hours),
    getProfiles(),
    getCategories(null),
    getTemplates(profileIds),
  ]);

  const currentMonth = parsePeriod(undefined);
  const projections = projectTemplates(
    templates,
    currentMonth.start,
    currentMonth.end,
    settings.display_currency,
    rates
  );
  const monthlyProjection = Object.fromEntries(
    projections.map((p) => [p.template.id, p.projectedDisplay])
  );

  return (
    <>
      <div className="page-head">
        <h1>Recurring</h1>
        <span className="fx-note">
          Templates project cash flow — they never write ledger rows themselves.
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <ProfileFilter profiles={profiles} active={activeProfile} />
      </div>

      <TemplateManager
        templates={templates}
        profiles={profiles}
        categories={categories}
        defaultCurrency={settings.display_currency}
        monthlyProjection={monthlyProjection}
        displayCurrency={settings.display_currency}
      />
    </>
  );
}
