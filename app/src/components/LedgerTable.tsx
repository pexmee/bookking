"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteEntry, restoreEntry } from "@/lib/actions";
import { formatOccurrence } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { Entry } from "@/lib/types";
import { CLASSIFICATION_LABELS } from "@/lib/types";

interface Props {
  entries: Entry[];
  showProfile: boolean;
}

export function LedgerTable({ entries, showProfile }: Props) {
  const [, startTransition] = useTransition();
  const [undoRow, setUndoRow] = useState<Record<string, unknown> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function remove(id: string) {
    startTransition(async () => {
      const row = await deleteEntry(id);
      if (row) {
        setUndoRow(row);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setUndoRow(null), 8000);
      }
    });
  }

  function undo() {
    const row = undoRow;
    setUndoRow(null);
    if (!row) return;
    startTransition(async () => {
      await restoreEntry(row);
    });
  }

  if (entries.length === 0) {
    return (
      <p className="empty-state">
        Nothing on the books matches these filters.
      </p>
    );
  }

  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 120 }}>When</th>
            <th>Note</th>
            <th>Category</th>
            <th style={{ width: 140 }}>Classification</th>
            {showProfile && <th style={{ width: 110 }}>Profile</th>}
            <th className="num" style={{ width: 130 }}>
              Amount
            </th>
            <th style={{ width: 40 }} aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatOccurrence(e.occurred_on, e.date_precision)}
                {e.date_precision !== "day" && (
                  <span
                    title={`Recorded to the ${e.date_precision} only`}
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {" "}
                    ~
                  </span>
                )}
              </td>
              <td style={{ color: e.description ? "inherit" : "var(--ink-faint)" }}>
                {e.description || "—"}
              </td>
              <td>{e.category_name}</td>
              <td style={{ color: "var(--ink-muted)", fontSize: "0.8125rem" }}>
                {CLASSIFICATION_LABELS[e.classification]}
              </td>
              {showProfile && (
                <td>
                  <span
                    className="pill-dot"
                    style={{ background: e.profile_color, marginRight: 6 }}
                  />
                  {e.profile_name}
                </td>
              )}
              <td
                className={`num money ${e.category_kind === "income" ? "money--in" : "money--out"}`}
              >
                {e.category_kind === "income" ? "+" : "−"}
                {formatMoney(Number(e.amount), e.currency)}
              </td>
              <td className="num">
                <button
                  className="row-delete"
                  aria-label={`Delete ${e.description || e.category_name}`}
                  title="Delete entry"
                  onClick={() => remove(e.id)}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {undoRow && (
        <div className="toast" role="status">
          Entry struck from the ledger.
          <button onClick={undo}>Undo</button>
        </div>
      )}
    </>
  );
}
