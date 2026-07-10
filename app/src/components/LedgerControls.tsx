"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function LedgerControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kind = searchParams.get("kind") ?? "";
  const q = searchParams.get("q") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  // "/" focuses search from anywhere outside an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="ledger-controls">
      <input
        ref={searchRef}
        className="input"
        placeholder="Search notes and categories…  ( / )"
        defaultValue={q}
        onChange={(e) => {
          if (debounce.current) clearTimeout(debounce.current);
          const value = e.target.value;
          debounce.current = setTimeout(() => setParam("q", value), 300);
        }}
      />
      <select
        className="select"
        style={{ width: 130 }}
        value={kind}
        onChange={(e) => setParam("kind", e.target.value)}
        aria-label="Filter by type"
      >
        <option value="">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expenses</option>
      </select>
    </div>
  );
}
