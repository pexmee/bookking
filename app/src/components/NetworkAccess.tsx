import { headers } from "next/headers";

/** Shows how to reach BookKing from other devices on the local network. */
export async function NetworkAccess() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}`;
  const onLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  return (
    <div className="panel section">
      <div className="panel__body">
        <h2>Network access</h2>
        {onLocalhost ? (
          <p className="stat__sub" style={{ marginTop: 8 }}>
            BookKing listens on all network interfaces. From another phone or computer
            on the same Wi‑Fi, open{" "}
            <code className="network-url">http://&lt;this-machine-ip&gt;:3000</code>{" "}
            — replace with your host&apos;s LAN address (e.g.{" "}
            <code className="network-url">192.168.1.42:3000</code>).
          </p>
        ) : (
          <p className="stat__sub" style={{ marginTop: 8 }}>
            You are viewing BookKing at{" "}
            <a className="network-url network-url--link" href={url}>
              {url}
            </a>
            . Other devices on the same network can use the same address.
          </p>
        )}
        <p className="stat__sub">
          BookKing has no login. Only use this on a trusted home network — do not
          expose port 3000 to the internet without authentication in front.
        </p>
      </div>
    </div>
  );
}
