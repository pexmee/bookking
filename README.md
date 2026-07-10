# Bookking

A self-hosted book of accounts. Track recurring and one-off income and expenses across
multiple profiles (personal, business, whatever you keep separate), in any currency,
and see where the money went, all on your own machine, with no account and no cloud.

## Run it (recommended - pre-built image)

You need this repository on disk for `docker-compose.yml` and the database migration
files. Clone it (or download a [release](https://github.com/pexmee/bookking/releases))
and start the stack:

```bash
git clone https://github.com/pexmee/bookking.git
cd bookking
docker compose pull
docker compose up -d
```

The app image is built automatically on each version tag and published to
[GitHub Container Registry](https://github.com/pexmee/bookking/pkgs/container/bookking)
as `ghcr.io/pexmee/bookking:latest` (and `ghcr.io/pexmee/bookking:v1.0.0`, etc.).
No local Node build is required.

Pin a specific release:

```bash
BOOKKING_VERSION=v1.0.0 docker compose pull app
BOOKKING_VERSION=v1.0.0 docker compose up -d
```

Then open [http://localhost:3000](http://localhost:3000). The stack brings up a
Supabase Postgres database (schema and starter categories are applied automatically on
first start), the Supabase REST layer, and the app.

> **First release?** After pushing tag `v1.0.0`, open the package settings on GitHub
> and set **Container visibility** to **Public** so `docker compose pull` works without
> logging in.

### Build from source (developers)

```bash
docker compose up -d --build
```

> **A deliberate note on security:** Bookking has no authentication by design. It is
> meant for localhost or a trusted home network. Do not expose port 3000 to the
> internet without putting basic auth on a reverse proxy in front of it.

## What it does

- **Ledger** - every entry of income or spending, in its native currency, added or
  struck in seconds. Press `n` anywhere to start a new entry, `/` to search.
- **Flexible dates** - an entry can be pinned to a day, or honestly recorded as just
  "July 2026" or "2026" when the day is unknown or irrelevant. Charts and totals
  handle imprecise dates correctly instead of pretending they happened on the 1st.
- **Recurring templates** - rent, salary, subscriptions. Templates project expected
  cash flow; they never write ledger rows behind your back. When the real bill
  arrives, "Log actual" records it in one click and links it to the template.
- **Profiles** - separate books that can be viewed alone or all together, each with
  its own categories and chart color. Add and remove them freely.
- **Multi-currency** - entries keep their own currency; everything is converted at
  display time to the currency you choose in Settings, using European Central Bank
  reference rates (via [Frankfurter](https://www.frankfurter.app), no API key). Rates
  are cached in the database, refreshed daily, and the app keeps working offline with
  the last known rates.
- **Overview** - mirrored cash-flow chart (income above the line, spending below), a
  Sankey of where money came from and where it went, projected-vs-actual variance for
  recurring categories, and a spending breakdown.
- **Export** - CSV or JSON of the full ledger from Settings.

## Stack

| Piece | Choice |
|-------|--------|
| App | Next.js (App Router, server actions), custom CSS design system |
| Database | Supabase Postgres (`supabase/postgres` image), schema in [`supabase/migrations`](supabase/migrations) |
| REST layer | PostgREST on `localhost:55321` (read-only role), the trimmed Supabase stack |
| FX rates | Frankfurter (ECB) cached in Postgres |

The visual language is documented in [`DESIGN.md`](DESIGN.md); it is the review gate
for any UI change.

## Development

```bash
docker compose up -d db     # database only, on localhost:55432
cd app
npm install
npm run dev                 # app on localhost:3000
```

The dev server connects to `postgres://supabase_admin:bookking@localhost:55432/postgres`
by default; override with `DATABASE_URL`.

To reset the database completely:

```bash
docker compose down -v && docker compose up -d
```

## Publishing a release

Push a version tag; GitHub Actions builds the image, publishes it to GHCR, and creates
a GitHub Release with `docker-compose.yml` and `.env.example` attached:

```bash
git tag v1.0.0
git push origin v1.0.0
```

After the workflow finishes, set the container package visibility to **Public** (only
needed once) under **Packages → bookking → Package settings**.

## Configuration

Copy `.env.example` to `.env` to override defaults: the Postgres password, the FX API
endpoint, and the initial display currency (`DEFAULT_DISPLAY_CURRENCY`, changeable
later in Settings).
