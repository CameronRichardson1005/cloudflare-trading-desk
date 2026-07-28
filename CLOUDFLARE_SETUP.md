# Trading Desk — Cloudflare setup

This project is the standalone Cloudflare version of the Trading Bot
Dashboard. It preserves the dashboard UI, API payload, D1 session history,
charts, replay views, strategy rules, and outcome tracking.

## 1. Install and authenticate

Use Node.js 22.13 or newer.

```bash
npm ci
npx wrangler login
npx wrangler whoami
```

## 2. Create the database

```bash
npx wrangler d1 create trading-desk --binding DB --update-config
```

Confirm that `wrangler.jsonc` now contains the real D1 `database_id` instead of
the all-zero placeholder.

Apply the included schema:

```bash
npm run db:migrate
```

The application also checks the table and index safely on first use.

## 3. Add the bot upload secret

Create a strong random key:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

Copy the value, then store it in Cloudflare:

```bash
npx wrangler secret put DASHBOARD_INGEST_KEY
```

Enter the same value in the Python bot's local `.env` as
`DASHBOARD_INGEST_KEY`. Never commit the value.

## 4. Build and deploy

```bash
npm run build
npm run deploy
```

Cloudflare will return the permanent `workers.dev` address. Put that address in
the bot's local `.env` as `DASHBOARD_URL`.

## 5. Protect the dashboard with Cloudflare Access

In Cloudflare Zero Trust:

1. Enable One-time PIN as an identity provider.
2. Create a self-hosted Access application for the dashboard hostname.
3. Add an Allow policy containing only your email address.
4. Create a service token for the Python bot.
5. Add a Service Auth policy that accepts that service token.

The bot must send these headers when uploading:

```text
CF-Access-Client-Id: <service-token client ID>
CF-Access-Client-Secret: <service-token client secret>
x-dashboard-key: <DASHBOARD_INGEST_KEY>
```

Keep all three values only in the bot's local `.env`.

## 6. Verify before switching

```bash
python main.py replay 2026-07-23 --speed 0
```

Confirm that the Cloudflare dashboard shows RIVN, PLTR, and PINS with their
outcomes and that session history remains available. Keep the ChatGPT-hosted
dashboard online until this check passes.
