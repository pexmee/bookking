"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/ledger", label: "Ledger" },
  { href: "/recurring", label: "Recurring" },
  { href: "/profiles", label: "Profiles" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar__wordmark">
        Bookking
      </Link>
      <nav className="sidebar__nav" aria-label="Primary">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link${active ? " sidebar__link--active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar__foot">
        Kept on your own machine.
        <br />
        No account, no cloud.
      </div>
    </aside>
  );
}
