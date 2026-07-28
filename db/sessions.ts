import { getDashboardRuntimeEnv } from "./runtime-env";

const CREATE_SESSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS trading_sessions (
    id TEXT PRIMARY KEY,
    trading_date TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    total_bars INTEGER NOT NULL,
    expected_bars INTEGER NOT NULL,
    payload TEXT NOT NULL
  )
`;

const CREATE_UPDATED_INDEX = `
  CREATE INDEX IF NOT EXISTS trading_sessions_updated_at_idx
  ON trading_sessions(updated_at DESC)
`;

export type StrategyLevels = {
  buy: number;
  target: number;
  stop: number;
  tradingStop: number;
};

export type MinuteBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type StrategyRule = {
  label: string;
  passed: boolean;
  actual: string;
  requirement: string;
};

export type StrategySnapshot = {
  atr?: number;
  openingOpen?: number;
  openingHigh?: number;
  openingLow?: number;
  openingClose?: number;
  candleRange?: number;
  atrThreshold?: number;
  isManipulation?: boolean;
  isRed?: boolean;
};

export type TradeOutcome = {
  status: "WIN" | "LOSS" | "NO ENTRY" | "STILL OPEN";
  entryTime?: string;
  exitTime?: string;
  entryPrice?: number;
  exitPrice?: number;
  pnlPerShare?: number;
  returnPct?: number;
  detail?: string;
};

export type SessionSymbol = {
  symbol: string;
  signal: "INVEST" | "NO INVEST" | "WARNING";
  barsProcessed: number;
  barsExpected: number;
  detail: string;
  levels?: StrategyLevels;
  rules?: StrategyRule[];
  strategy?: StrategySnapshot;
  minuteBars?: MinuteBar[];
  outcome?: TradeOutcome;
};

export type TradingSession = {
  id: string;
  tradingDate: string;
  source: "REPLAY" | "LIVE";
  dataFeed: "SIP";
  status: "COMPLETE" | "INCOMPLETE";
  updatedAt: string;
  symbols: SessionSymbol[];
};

function database(): D1Database {
  const env = getDashboardRuntimeEnv();
  if (!env.DB) {
    throw new Error("Dashboard database is unavailable.");
  }
  return env.DB;
}

export async function ensureSessionSchema() {
  const db = database();
  await db.batch([
    db.prepare(CREATE_SESSIONS_TABLE),
    db.prepare(CREATE_UPDATED_INDEX),
  ]);
}

export async function latestSession(): Promise<TradingSession | null> {
  await ensureSessionSchema();
  const row = await database()
    .prepare(
      `SELECT payload
       FROM trading_sessions
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
    .first<{ payload: string }>();

  return row ? (JSON.parse(row.payload) as TradingSession) : null;
}

export async function listSessions(limit = 100): Promise<TradingSession[]> {
  await ensureSessionSchema();
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
  const result = await database()
    .prepare(
      `SELECT payload
       FROM trading_sessions
       ORDER BY trading_date DESC, updated_at DESC
       LIMIT ?`,
    )
    .bind(safeLimit)
    .all<{ payload: string }>();

  return result.results.map(
    (row) => JSON.parse(row.payload) as TradingSession,
  );
}

export async function saveSession(session: TradingSession) {
  await ensureSessionSchema();
  const totalBars = session.symbols.reduce(
    (total, symbol) => total + symbol.barsProcessed,
    0,
  );
  const expectedBars = session.symbols.reduce(
    (total, symbol) => total + symbol.barsExpected,
    0,
  );

  await database()
    .prepare(
      `INSERT INTO trading_sessions (
        id, trading_date, source, status, updated_at,
        total_bars, expected_bars, payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        trading_date = excluded.trading_date,
        source = excluded.source,
        status = excluded.status,
        updated_at = excluded.updated_at,
        total_bars = excluded.total_bars,
        expected_bars = excluded.expected_bars,
        payload = excluded.payload`,
    )
    .bind(
      session.id,
      session.tradingDate,
      session.source,
      session.status,
      session.updatedAt,
      totalBars,
      expectedBars,
      JSON.stringify(session),
    )
    .run();
}
