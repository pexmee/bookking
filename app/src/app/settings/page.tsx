import { formatDistanceToNowStrict } from "date-fns";
import type { Metadata } from "next";
import { SettingsForm } from "@/components/SettingsForm";
import { getRates } from "@/lib/fx";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  const rates = await getRates(settings.fx_stale_hours);

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
      </div>

      <SettingsForm settings={settings} />

      <div className="panel section">
        <div className="panel__body">
          <h2>Exchange rates</h2>
          <p className="stat__sub" style={{ marginTop: 8 }}>
            {rates.fetchedAt
              ? `${rates.rates.size} currencies cached · rates from the European Central
                 Bank via Frankfurter · updated ${formatDistanceToNowStrict(rates.fetchedAt, { addSuffix: true })}.`
              : "No rates cached yet. They are fetched automatically the first time the app can reach the exchange-rate service."}
          </p>
          <p className="stat__sub">
            Every entry keeps its native currency; conversion happens only at
            display time, so nothing is lost if rates change.
          </p>
        </div>
      </div>

      <div className="panel section">
        <div className="panel__body">
          <h2>Your data</h2>
          <p className="stat__sub" style={{ margin: "8px 0 14px" }}>
            Everything lives in the Postgres volume next to this app. Take a
            copy any time.
          </p>
          <p style={{ display: "flex", gap: 10 }}>
            <a className="btn btn--ghost" href="/api/export?format=csv" download>
              Download CSV
            </a>
            <a className="btn btn--ghost" href="/api/export?format=json" download>
              Download JSON
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
