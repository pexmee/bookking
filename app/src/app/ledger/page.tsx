import type { Metadata } from "next";
import { ProfileFilter } from "@/components/filters";
import { LedgerControls } from "@/components/LedgerControls";
import { LedgerTable } from "@/components/LedgerTable";
import { QuickAdd } from "@/components/QuickAdd";
import {
  getCategories,
  getLedgerEntries,
  getProfiles,
  getSettings,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ledger" };

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; kind?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const activeProfile = sp.profile ?? "all";
  const profileIds = activeProfile === "all" ? null : [activeProfile];

  const [settings, profiles, categories, entries] = await Promise.all([
    getSettings(),
    getProfiles(),
    getCategories(null),
    getLedgerEntries({
      profileIds,
      kind: sp.kind === "income" || sp.kind === "expense" ? sp.kind : undefined,
      search: sp.q,
    }),
  ]);

  return (
    <>
      <div className="page-head">
        <h1>Ledger</h1>
        <span className="fx-note">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"} shown ·
          amounts in their native currency
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <ProfileFilter profiles={profiles} active={activeProfile} />
      </div>

      <QuickAdd
        profiles={profiles}
        categories={categories}
        defaultCurrency={settings.display_currency}
        activeProfile={activeProfile}
      />

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel__body">
          <LedgerControls />
          <LedgerTable entries={entries} showProfile={activeProfile === "all"} />
        </div>
      </div>
    </>
  );
}
