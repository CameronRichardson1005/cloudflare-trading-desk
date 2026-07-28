# Cameron's Trading Desk

A private, read-only day-trading dashboard deployed on Cloudflare Workers with
session history stored in Cloudflare D1.

## Features

- INVEST, NO INVEST, and WARNING signals
- Opening-range candlestick charts
- Strategy rule explanations and ATR details
- Buy, target, stop, and trailing-stop levels
- Live and historical replay sessions
- WIN, LOSS, NO ENTRY, and STILL OPEN outcomes
- Per-share performance summaries
- Authenticated uploads from the Python trading bot
- No brokerage connection and no order placement

## Local commands

```bash
npm ci
npm run cf:types
npm run build
npm test
npm run typecheck
npm run lint
```

For the first Cloudflare deployment, follow
[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).
