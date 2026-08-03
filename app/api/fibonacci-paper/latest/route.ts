import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  latestFibonacciPaperStatus,
  saveFibonacciPaperStatus,
  type FibonacciPaperMetrics,
  type FibonacciPaperSetup,
  type FibonacciPaperStatus,
} from "../../../../db/fibonacci-paper";
import {
  getDashboardRuntimeEnv,
} from "../../../../db/runtime-env";

export const dynamic = "force-dynamic";

function validNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function validNullableNumber(value: unknown) {
  return value === null || validNumber(value);
}

function validNonNegativeInteger(value: unknown) {
  return (
    Number.isInteger(value) &&
    Number(value) >= 0
  );
}

function validateMetrics(
  value: unknown,
): value is FibonacciPaperMetrics {
  if (!value || typeof value !== "object") {
    return false;
  }

  const metrics = value as Record<string, unknown>;

  return (
    validNonNegativeInteger(
      metrics.qualifyingSetups,
    ) &&
    validNonNegativeInteger(metrics.closedTrades) &&
    validNonNegativeInteger(metrics.wins) &&
    validNonNegativeInteger(metrics.losses) &&
    validNullableNumber(metrics.winRatePct) &&
    validNullableNumber(metrics.profitFactor) &&
    validNullableNumber(metrics.averageReturnPct) &&
    validNumber(metrics.cumulativeReturnPct)
  );
}

function validateSetup(
  value: unknown,
): value is FibonacciPaperSetup | null {
  if (value === null) {
    return true;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const setup = value as Record<string, unknown>;

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(setup.tradingDate),
    ) &&
    typeof setup.symbol === "string" &&
    typeof setup.fibonacciLevel === "string" &&
    ["WIN", "LOSS"].includes(
      String(setup.outcome),
    ) &&
    validNumber(setup.netReturnPct) &&
    setup.submitted === "NO"
  );
}

function validateStatus(
  value: unknown,
): value is FibonacciPaperStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const status = value as Record<string, unknown>;

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(
      String(status.tradingDate),
    ) &&
    !Number.isNaN(
      Date.parse(String(status.updatedAt)),
    ) &&
    typeof status.todayCompleted === "boolean" &&
    status.safetyStatus ===
      "PAPER ONLY — NOT SUBMITTED" &&
    validateMetrics(status.forward) &&
    validateSetup(status.latestForwardSetup)
  );
}

export async function GET() {
  try {
    return NextResponse.json({
      fibonacciPaper:
        await latestFibonacciPaperStatus(),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Fibonacci paper status is temporarily unavailable.",
      },
      { status: 503 },
    );
  }
}

export async function POST(
  request: NextRequest,
) {
  const env = getDashboardRuntimeEnv();
  const configuredKey =
    env.DASHBOARD_INGEST_KEY;
  const suppliedKey =
    request.headers.get("x-dashboard-key");

  if (
    !configuredKey ||
    suppliedKey !== configuredKey
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 },
    );
  }

  let candidate: unknown;

  try {
    candidate = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON." },
      { status: 400 },
    );
  }

  if (!validateStatus(candidate)) {
    return NextResponse.json(
      {
        error:
          "Fibonacci paper payload failed validation.",
      },
      { status: 422 },
    );
  }

  await saveFibonacciPaperStatus(candidate);

  return NextResponse.json({
    accepted: true,
    tradingDate: candidate.tradingDate,
    safetyStatus: candidate.safetyStatus,
  });
}
