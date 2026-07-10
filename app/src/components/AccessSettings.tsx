import { authUsernames, isAuthEnabled } from "@/lib/auth";
import { headers } from "next/headers";

/** Network binding and login status for Settings. */
export async function AccessSettings() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? "https";
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
            BookKing is served over <strong>HTTPS only</strong> (port 443 via Caddy).
            By default it binds to <strong>localhost</strong>. To use it from a phone
            on the same Wi‑Fi: run <code className="network-url">scripts/setup-certs</code>,
            install the mkcert root CA on the phone once, set login users in{" "}
            <code className="network-url">.env</code>, then change the{" "}
            <strong>caddy</strong> port in <code className="network-url">docker-compose.yml</code>{" "}
            to <code className="network-url">0.0.0.0:443:443</code> and restart.
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
          <p className="stat__sub">
            Re-run setup-certs when your LAN IP changes or before certificates expire
            (~2 years). See README for Let&apos;s Encrypt as an alternative.
          </p>
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
                <code className="network-url">user:pass</code> pairs), then restart.
              </p>
            </>
          ) : (
            <p className="stat__sub" style={{ marginTop: 8 }}>
              No login configured — anyone who can reach the app can use it.{" "}
              <strong>Set up users before enabling LAN access.</strong> Add{" "}
              <code className="network-url">BOOKKING_AUTH_USERS=you:your-password</code> to{" "}
              <code className="network-url">.env</code>, then restart.
            </p>
          )}
          <p className="stat__sub">
            Do not expose port 443 to the internet without login configured.
          </p>
        </div>
      </div>
    </>
  );
}
