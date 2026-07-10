import { getLedgerEntries } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "json";
  const entries = await getLedgerEntries({ profileIds: null, limit: 100000 });

  const rows = entries.map((e) => ({
    occurred_on: e.occurred_on,
    date_precision: e.date_precision,
    profile: e.profile_name,
    category: e.category_name,
    kind: e.category_kind,
    classification: e.classification,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
  }));

  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = Object.keys(
      rows[0] ?? { occurred_on: "", date_precision: "", profile: "", category: "", kind: "", classification: "", description: "", amount: "", currency: "" }
    );
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((h) => escape(r[h as keyof typeof r])).join(",")),
    ].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookking-${stamp}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify(rows, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="bookking-${stamp}.json"`,
    },
  });
}
