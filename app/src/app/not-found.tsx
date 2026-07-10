import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ paddingTop: 96, maxWidth: 420 }}>
      <p className="label">404</p>
      <h1 style={{ fontSize: "2.5rem", marginTop: 8 }}>
        This page isn&rsquo;t on the books.
      </h1>
      <p style={{ color: "var(--ink-muted)", marginTop: 12 }}>
        Whatever you were looking for was never recorded here, or has since
        been struck from the ledger.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/" className="btn btn--ghost">
          Back to the overview
        </Link>
      </p>
    </div>
  );
}
