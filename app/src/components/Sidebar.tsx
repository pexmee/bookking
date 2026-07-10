"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

const NAV = [
  { href: "/", label: "Overview", shortLabel: "Home" },
  { href: "/ledger", label: "Ledger", shortLabel: "Ledger" },
  { href: "/recurring", label: "Recurring", shortLabel: "Repeat" },
  { href: "/profiles", label: "Profiles", shortLabel: "Profiles" },
  { href: "/settings", label: "Settings", shortLabel: "Settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="sidebar__wordmark">
          <Wordmark />
        </Link>
        <nav className="sidebar__nav" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link${isActive(pathname, item.href) ? " sidebar__link--active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar__foot">
          Kept on your own machine.
          <br />
          No account, no cloud.
          <a
            href="https://github.com/pexmee"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar__credit"
          >
            Made by pexmee
          </a>
        </div>
      </aside>

      <header className="mobile-header">
        <Link href="/" className="mobile-header__wordmark">
          <Wordmark />
        </Link>
      </header>

      <nav className="mobile-nav" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav__link${isActive(pathname, item.href) ? " mobile-nav__link--active" : ""}`}
          >
            {item.shortLabel}
          </Link>
        ))}
      </nav>
    </>
  );
}
