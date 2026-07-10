import { authUsernames, isAuthEnabled } from "@/lib/auth";
import { headers } from "next/headers";

/** Network binding and login status for Settings. */
export async function AccessSettings() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}`;
  const onLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const authOn = isAuthEnabled();
  const users = authUsernames();

  return (
    <>
      <div className="panel section">
        <div className="panel__body">
          <h2>Access</h2>
          <p className="stat__sub" style={{ marginTop: 8 }}>
            By default BookKing binds to <strong>localhost only</strong> — other devices
            on your network cannot reach it. To use BookKing from a phone on the same
            Wi‑Fi, edit <code className="network-url">docker-compose.yml</code>: change
            the app port from{" "}
            <code className="network-url">127.0.0.1:3000:3000</code> to{" "}
            <code className="network-url">0.0.0.0:3000:3000</code>, then run{" "}
            <code className="network-url">docker compose up -d</code>. Open{" "}
            <code className="network-url">http://&lt;your-pc-ip&gt;:3000</code> on the
            phone (find the IP with <code className="network-url">ipconfig</code> or{" "}
            <code className="network-url">ip addr</code>). Allow port 3000 through your
            firewall if needed.
          </p>
          {!onLocalhost && (
            <p className="stat__sub">
              You are viewing BookKing at{" "}
              <a className="network-url network-url--link" href={url}>
                {url}
              </a>
              .
            </p>
          )}
        </div>
      </div>

      <div className="panel section">
        <div className="panel__body">
          <h2>Login</h2>
          {authOn ? (
            <>
              <p className="stat__sub" style={{ marginTop: 8 }}>
                HTTP Basic authentication is <strong>on</strong>. Configured users:{" "}
                {users.join(", ")}. Each user gets their own ledger, profiles, and
                settings — sign in with different credentials to switch books.
              </p>
              <p className="stat__sub">
                Add or change users in <code className="network-url">.env</code> as{" "}
                <code className="network-url">BOOKKING_AUTH_USERS</code> (comma-separated{" "}
                <code className="network-url">user:pass</code> pairs) or copy{" "}
                <code className="network-url">auth.users.example</code> to{" "}
                <code className="network-url">auth.users</code>, uncomment the volume in{" "}
                <code className="network-url">docker-compose.yml</code>, and restart.
              </p>
            </>
          ) : (
            <p className="stat__sub" style={{ marginTop: 8 }}>
              No login configured — anyone who can reach the app can use it.{" "}
              <strong>Set up users before enabling LAN access.</strong> Add{" "}
              <code className="network-url">BOOKKING_AUTH_USERS=you:your-password</code> to{" "}
              <code className="network-url">.env</code> (or use an{" "}
              <code className="network-url">auth.users</code> file — see{" "}
              <code className="network-url">auth.users.example</code>), then restart the
              app container.
            </p>
          )}
          <p className="stat__sub">
            Do not expose port 3000 to the internet. Basic auth is fine for a home
            network; use a reverse proxy with TLS if you need remote access.
          </p>
        </div>
      </div>
    </>
  );
}
