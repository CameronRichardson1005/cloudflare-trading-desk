import { getDashboardRuntimeEnv } from "./runtime-env";

const CREATE_FIBONACCI_PAPER_TABLE = `
  CREATE TABLE IF NOT EXISTS fibonacci_paper_status (
    id TEXT PRIMARY KEY,
    trading_date TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    payload TEXT NOT NULL
  )
`;

export type FibonacciPaperMetrics = {
  qualifyingSetups: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRatePct: number | null;
  profitFactor: number | null;
  averageReturnPct: number | null;
  cumulativeReturnPct: number;
};

export type FibonacciPaperSetup = {
  tradingDate: string;
  symbol: string;
  fibonacciLevel: string;
  outcome: "WIN" | "LOSS";
  netReturnPct: number;
  submitted: "NO";
};

export type FibonacciPaperStatus = {
  tradingDate: string;
  updatedAt: string;
  todayCompleted: boolean;
  safetyStatus: "PAPER ONLY — NOT SUBMITTED";
  forward: FibonacciPaperMetrics;
  latestForwardSetup: FibonacciPaperSetup | null;
};

function database(): D1Database {
  const env = getDashboardRuntimeEnv();

  if (!env.DB) {
    throw new Error("Dashboard database is unavailable.");
  }

  return env.DB;
}

export async function ensureFibonacciPaperSchema() {
  await database()
    .prepare(CREATE_FIBONACCI_PAPER_TABLE)
    .run();
}

export async function latestFibonacciPaperStatus():
  Promise<FibonacciPaperStatus | null> {
  await ensureFibonacciPaperSchema();

  const row = await database()
    .prepare(
      `SELECT payload
       FROM fibonacci_paper_status
       WHERE id = 'latest'
       LIMIT 1`,
    )
    .first<{ payload: string }>();

  return row
    ? (JSON.parse(row.payload) as FibonacciPaperStatus)
    : null;
}

export async function saveFibonacciPaperStatus(
  status: FibonacciPaperStatus,
) {
  await ensureFibonacciPaperSchema();

  await database()
    .prepare(
      `INSERT INTO fibonacci_paper_status (
        id,
        trading_date,
        updated_at,
        payload
      ) VALUES ('latest', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        trading_date = excluded.trading_date,
        updated_at = excluded.updated_at,
        payload = excluded.payload`,
    )
    .bind(
      status.tradingDate,
      status.updatedAt,
      JSON.stringify(status),
    )
    .run();
}
