"use client";

import { useState, useTransition } from "react";
import {
  createCategory,
  createProfile,
  deleteCategory,
  deleteProfile,
  updateProfile,
} from "@/lib/actions";
import type { Category, EntryKind, Profile } from "@/lib/types";
import { CLASSIFICATION_LABELS, PROFILE_PALETTE } from "@/lib/types";

export function ProfileManager({
  profiles,
  categories,
}: {
  profiles: Profile[];
  categories: Category[];
}) {
  return (
    <>
      <NewProfileForm existingCount={profiles.length} />
      {profiles.map((p) => (
        <ProfileCard
          key={p.id}
          profile={p}
          categories={categories.filter((c) => c.profile_id === p.id)}
          deletable={profiles.length > 1}
        />
      ))}
    </>
  );
}

function NewProfileForm({ existingCount }: { existingCount: number }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(
    PROFILE_PALETTE[existingCount % PROFILE_PALETTE.length]
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProfile(name, color);
      if (result?.error) setError(result.error);
      else {
        setName("");
        setError(null);
      }
    });
  }

  return (
    <form className="quick-add panel" onSubmit={submit}>
      <div className="field" style={{ flex: "1 1 180px", maxWidth: 280 }}>
        <label className="label" htmlFor="np-name">
          New profile
        </label>
        <input
          id="np-name"
          className="input"
          placeholder="e.g. Business, Household, Side project…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <span className="label">Chart color</span>
        <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
          {PROFILE_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Use color ${c}`}
              onClick={() => setColor(c)}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border: color === c ? "2px solid var(--ink)" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Creating…" : "Add profile"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}

function ProfileCard({
  profile,
  categories,
  deletable,
}: {
  profile: Profile;
  categories: Category[];
  deletable: boolean;
}) {
  const [name, setName] = useState(profile.name);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const income = categories.filter((c) => c.kind === "income");
  const expense = categories.filter((c) => c.kind === "expense");

  return (
    <div className="panel section">
      <div className="panel__body">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <span
            className="pill-dot"
            style={{ background: profile.color, width: 14, height: 14, marginBottom: 10 }}
          />
          <div className="field" style={{ width: 220 }}>
            <span className="label">Profile name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim() && name !== profile.name) {
                  startTransition(() => updateProfile(profile.id, name, profile.color));
                }
              }}
            />
          </div>
          <div className="field">
            <span className="label">Color</span>
            <div style={{ display: "flex", gap: 6, paddingTop: 4, paddingBottom: 6 }}>
              {PROFILE_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Set ${profile.name} color to ${c}`}
                  onClick={() =>
                    startTransition(() => updateProfile(profile.id, name, c))
                  }
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: c,
                    border:
                      profile.color === c
                        ? "2px solid var(--ink)"
                        : "2px solid transparent",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ marginLeft: "auto", paddingBottom: 4 }}>
            {deletable &&
              (confirming ? (
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--wine)" }}>
                    Deletes every entry and template in {profile.name}.
                  </span>
                  <button
                    className="btn btn--danger btn--small"
                    disabled={pending}
                    onClick={() => startTransition(() => deleteProfile(profile.id))}
                  >
                    Delete for good
                  </button>
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={() => setConfirming(false)}
                  >
                    Keep it
                  </button>
                </span>
              ) : (
                <button
                  className="btn btn--danger btn--small"
                  onClick={() => setConfirming(true)}
                >
                  Delete profile
                </button>
              ))}
          </div>
        </div>

        <CategoryList title="Income categories" items={income} />
        <CategoryList title="Expense categories" items={expense} />
        <AddCategoryForm profileId={profile.id} />
      </div>
    </div>
  );
}

function CategoryList({ title, items }: { title: string; items: Category[] }) {
  const [, startTransition] = useTransition();
  return (
    <div style={{ marginTop: 16 }}>
      <span className="label">{title}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {items.map((c) => (
          <span key={c.id} className="category-chip">
            {c.name}
            <span className="category-chip__class">
              {CLASSIFICATION_LABELS[c.classification]}
            </span>
            <button
              className="row-delete"
              aria-label={`Delete category ${c.name}`}
              title="Delete category and its entries"
              onClick={() => startTransition(() => deleteCategory(c.id))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function AddCategoryForm({ profileId }: { profileId: string }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<EntryKind>("expense");
  const [classification, setClassification] = useState("discretionary");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCategory(profileId, name, kind, classification);
      if (result?.error) setError(result.error);
      else {
        setName("");
        setError(null);
      }
    });
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 16, flexWrap: "wrap" }}
    >
      <div className="field" style={{ width: 180 }}>
        <span className="label">New category</span>
        <input
          className="input"
          placeholder="e.g. Pets, Equipment…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <select
        className="select"
        style={{ width: 110 }}
        value={kind}
        onChange={(e) => setKind(e.target.value as EntryKind)}
        aria-label="Category type"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <select
        className="select"
        style={{ width: 170 }}
        value={classification}
        onChange={(e) => setClassification(e.target.value)}
        aria-label="Classification"
      >
        {Object.entries(CLASSIFICATION_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button className="btn btn--ghost" type="submit" disabled={pending}>
        Add category
      </button>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
