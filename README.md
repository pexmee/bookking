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
  <sub>Self-hosted · No account · Pre-built Docker image</sub>
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
and no cloud.

## Quick start

Requires [Docker](https://docs.docker.com/get-docker/). Clone the repository and start
the stack:

```bash
git clone https://github.com/pexmee/bookking.git
cd bookking
docker compose pull
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000). On first start, BookKing creates
the database, applies the schema, and seeds a starter profile with sensible categories.
No build step required.

To pin a specific [release](https://github.com/pexmee/bookking/releases):

```bash
BOOKKING_VERSION=v1.0.0 docker compose pull app
BOOKKING_VERSION=v1.0.0 docker compose up -d
```

> **Security:** BookKing has no login by design. It is meant for localhost or a trusted
> home network. Do not expose port 3000 to the internet without putting authentication
> in front of it (e.g. basic auth on a reverse proxy).

## Demo
![App Demo](./docs/showcase.gif)

## Features

- **Ledger** — log income and spending in seconds. Press `n` to add an entry, `/` to
  search.
- **Flexible dates** — pin an entry to a day, a month, or a year when the exact day
  is unknown or does not matter.
- **Recurring templates** — project rent, salary, and subscriptions without
  auto-generating ledger rows. Log the real amount when the bill arrives.
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
endpoint, or default display currency. You can also change the display currency later
in the app under Settings.

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
docker compose pull app          # or: docker compose pull
docker compose up -d
```

To pin a specific version instead of `latest`:

```bash
BOOKKING_VERSION=v1.0.1 docker compose pull app
BOOKKING_VERSION=v1.0.1 docker compose up -d
```

Export CSV or JSON from Settings first if you want a backup before upgrading.

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
