# Luma

A dashboard to manage and access your machines, with role-based access control, audit logging, and remote connections through Apache Guacamole.

## Features

- **Machine inventory** — track machines with types, status, and metadata
- **Remote access** — connect to machines through Guacamole (SSH, RDP) with session recording
- **Ping & logs** — check machine health and view recent activity
- **Roles & permissions** — fine-grained RBAC (users, roles, permissions, machine types)
- **Audit trail** — full audit and access logs for every action
- **Authentication** — email/password with optional OIDC / generic OAuth providers
- **Dashboard** — overview of machines, sessions, and status

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **better-auth** — authentication (email/password + OIDC)
- **Drizzle ORM** + SQLite — database
- **Apache Guacamole** (guacd) — remote desktop gateway
- **Vitest** — tests

## Getting started

### Prerequisites

- Node.js 20+
- pnpm
- A running [guacd](https://guacamole.apache.org/doc/gug/guacamole-docker.html) server (optional, for remote connections)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy the environment template and fill it in
cp .env.example .env
#   - BETTER_AUTH_SECRET: generate one with `openssl rand -hex 32`
#   - DATABASE_URL: sqlite:./data/luma.db
#   - GUACD_HOST / GUACD_PORT: your guacd server (default localhost:4822)

# 3. Set up the database
pnpm db:push        # create tables
pnpm db:seed        # seed initial roles/permissions (optional)

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run tests |
| `pnpm db:push` / `db:migrate` | Push or migrate the database schema |
| `pnpm db:seed` | Seed initial data |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BETTER_AUTH_SECRET` | ✅ | Auth secret (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | | Public URL of the app |
| `DATABASE_URL` | ✅ | SQLite database path |
| `ENABLE_REGISTRATION` | | Allow self-registration (default `false`) |
| `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` / `OIDC_ISSUER` / `OIDC_NAME` | | Optional OIDC provider |
| `CONNECTION_ENCRYPTION_KEY` | | Key for encrypting connection credentials (min 32 chars) |
| `GUACD_HOST` / `GUACD_PORT` | | guacd server address (default `localhost:4822`) |

## Project structure

```
app/
  (auth)/            # login, register
  api/               # REST API (auth, machines, connections, audit...)
  dashboard/         # dashboard UI (machines, audit, settings)
components/          # UI components
db/                  # Drizzle schema, migrations, seed
lib/
  auth/              # better-auth config
  connect/           # guacd handshake / Guacamole integration
  machines/          # machine logic
  rbac/              # role-based access control
  audit/             # audit logging
```
