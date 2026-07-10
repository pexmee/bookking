<p align="center">
  <a href="https://github.com/pexmee/bookking">
    <img
      src="https://raw.githubusercontent.com/pexmee/bookking/master/docs/banner.png"
      alt="BookKing — a self-hosted book of accounts"
      width="100%"
    />
  </a>
</p>

<p align="center">
  <strong>Track income and spending across profiles and currencies.</strong><br/>
  <sub>Self-hosted · Local-first · Optional login</sub>
</p>

<p align="center">
  <a href="https://github.com/pexmee/bookking/releases/latest"><img src="https://img.shields.io/github/v/release/pexmee/bookking?style=flat-square&color=B87333" alt="Release"/></a>
  <a href="https://github.com/pexmee/bookking/pkgs/container/bookking"><img src="https://img.shields.io/badge/container-ghcr.io-2C3E50?style=flat-square" alt="Container registry"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-6B7F6A?style=flat-square" alt="MIT License"/></a>
</p>

---

BookKing is a self-hosted book of accounts. Track recurring and one-off income and
expenses across multiple profiles (personal, business, whatever you keep separate), in
any currency, and see where the money went — all on your own machine, with no account
and no cloud. By default it is reachable only on this machine; you can optionally
open it to your home network with login.

## Quick start

Requires [Docker](https://docs.docker.com/get-docker/) and [mkcert](https://github.com/FiloSottile/mkcert#installation)
(for locally trusted HTTPS — no browser warnings once set up).

```bash
git clone https://github.com/pexmee/bookking.git
cd bookking
./scripts/setup-certs.sh          # Windows: .\scripts\setup-certs.ps1
docker compose pull
docker compose up -d
```

Open **[https://localhost](https://localhost)** (HTTPS only — there is no HTTP endpoint).
On first start, BookKing creates the database, applies the schema, and seeds a starter
profile with sensible categories.

To pin a specific [release](https://github.com/pexmee/bookking/releases):

```bash
BOOKKING_VERSION=v1.0.0 docker compose pull app caddy
BOOKKING_VERSION=v1.0.0 docker compose up -d
```

> **Security:** By default BookKing binds to **localhost only** — other devices on
> your network cannot reach it, and no login is required. See [Access from your
> phone](#access-from-your-phone-optional) if you want to use it from a phone on the
> same Wi‑Fi.

## Access from your phone (optional)

BookKing works in the mobile browser over **HTTPS only**. To reach it from a phone or
another computer on the same Wi‑Fi:

1. **Set up login** — add users to `.env` (one ledger per username):
   ```bash
   BOOKKING_AUTH_USERS=you:your-password,partner:their-password
   ```
   Each username gets their own profiles, entries, and settings.

2. **Generate TLS certificates** (if you have not already):
   ```bash
   ./scripts/setup-certs.sh    # Windows: .\scripts\setup-certs.ps1
   ```
   Re-run when your LAN IP changes or before the cert expires (~2 years). The script
   prints where `rootCA.pem` lives.

3. **Trust the certificate on your phone** (one time per device — this removes browser
   warnings):
   - Copy `rootCA.pem` from the path printed by setup-certs (run `mkcert -CAROOT`).
   - **iOS:** AirDrop or email the file → install profile → Settings → General →
     About → Certificate Trust Settings → enable full trust for the mkcert root.
   - **Android:** Settings → Security → Install a certificate → CA certificate →
     pick `rootCA.pem`.

4. **Allow LAN connections** — in `docker-compose.yml`, change the **caddy** port:
   ```yaml
   ports:
     - "0.0.0.0:443:443   # was 127.0.0.1:443:443
   ```

5. **Restart:** `docker compose up -d --build`

6. On the phone, open `https://<your-computer-ip>` (e.g. `https://192.168.1.42`).
   Find your IP with `ipconfig` (Windows) or `ip addr` (macOS/Linux). The browser
   will ask for your BookKing username and password.

Allow port **443** through your host firewall if other devices cannot connect.

**Alternative — public domain:** if you have a domain pointing at this machine, set
`BOOKKING_DOMAIN=bookking.example.com` and `ACME_EMAIL=you@example.com` in `.env`.
Caddy obtains and renews a Let's Encrypt certificate automatically (no mkcert on
phones). Port 443 must be reachable for ACME validation.

Do not expose BookKing to the internet without login configured.

Settings shows whether login is configured and lists usernames (not passwords).

## Demo
![App Demo](./docs/showcase.gif)

## Features

- **Ledger** — log income and spending in seconds. Press `n` to add an entry, `/` to
  search.
- **Flexible dates** — pin an entry to a day, a month, or a year when the exact day
  is unknown or does not matter.
- **Recurring templates** — rent, salary, and subscriptions are logged automatically on
  their schedule. Adjust the amount when the real figure differs.
- **Profiles** — separate books (personal, business, etc.) you can view alone or
  together.
- **Multi-currency** — entries keep their native currency; everything converts to your
  chosen display currency using ECB reference rates ([Frankfurter](https://www.frankfurter.app),
  no API key). Rates are cached and refreshed daily.
- **Overview** — cash-flow chart, Sankey diagram, projected-vs-actual variance, and
  category breakdown.
- **Export** — download the full ledger as CSV or JSON from Settings.

## Configuration

Optional: copy `.env.example` to `.env` to change the database password, FX API
endpoint, default display currency, or configure login users (`BOOKKING_AUTH_USERS`).
TLS uses mkcert by default (`scripts/setup-certs`); or set `BOOKKING_DOMAIN` for
Let's Encrypt. You can also change the display currency later in the app under Settings.

## Data persistence, stopping, and upgrades

Your ledger lives in a Docker named volume (`db-data`), not inside the containers.
Entries, profiles, settings, and cached exchange rates survive container restarts and
system reboots. The stack is configured with `restart: unless-stopped`, so it comes
back when Docker starts.

**Safe shutdown** — stops containers but keeps your data:

```bash
docker compose down
```

**Upgrade to a newer release** — pulls a new app image without touching the database:

```bash
cd bookking
git pull
docker compose pull app caddy          # or: docker compose pull
docker compose up -d
```

To pin a specific version instead of `latest`:

```bash
BOOKKING_VERSION=v1.0.1 docker compose pull app
BOOKKING_VERSION=v1.0.1 docker compose up -d
```

Export CSV or JSON from Settings first if you want a backup before upgrading.

**Database migrations (existing installs only)** — schema files live in
`supabase/migrations/`. They run automatically on a **fresh** install (empty
`db-data` volume). They do **not** run when you upgrade an existing database — a
normal `git pull` + `docker compose up -d` keeps your volume and skips pending
migrations.

If a release adds a migration and you skip it, the app may fail on startup or when
using new features. After upgrading, apply any new files you have not run yet:

| Migration | Purpose |
|-------------|---------|
| `0002_recurring_materialize.sql` | Auto-log recurring items |
| `0003_users.sql` | Separate ledger per login user |

```bash
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD:-bookking}" -i bookking-db-1 \
  psql -U supabase_admin -d postgres \
  -f /docker-entrypoint-initdb.d/0003_users.sql
```

Replace the filename if you still need an earlier migration. Then rebuild the app:
`docker compose up -d --build`.

**New installs** (clone, first `docker compose up`) get the full schema automatically;
no manual step.

**Wipe all data and start fresh** — only use this when you mean to delete everything.
The `-v` flag removes the database volume:

```bash
docker compose down -v && docker compose up -d
```

## Contributing

Interested in hacking on BookKing? See [`DESIGN.md`](DESIGN.md) for the visual system
and run the app locally with:

```bash
docker compose up -d db
cd app && npm install && npm run dev
```

The dev server connects to Postgres on `localhost:55432` by default.

## License

[MIT](LICENSE)
