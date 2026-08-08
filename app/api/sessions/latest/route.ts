import { NextRequest, NextResponse } from "next/server";
import {
  latestSession,
  saveSession,
  type SessionSymbol,
  type TradingSession,
} from "../../../../db/sessions";
import { getDashboardRuntimeEnv } from "../../../../db/runtime-env";
import { suppressUnsafeLevels } from "../../../../db/session-safety";
import {
  validateWebullApprovals,
  validateWebullSafety,
} from "../../../../db/webull-approval-safety";
import {
  validatePaperPerformance,
} from "../../../../db/paper-performance-safety";

export const dynamic = "force-dynamic";

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validOptionalNumber(value: unknown) {
  return value === undefined || validNumber(value);
}

function validateRule(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const rule = value as Record<string, unknown>;
  return (
    typeof rule.label === "string" &&
    typeof rule.passed === "boolean" &&
    typeof rule.actual === "string" &&
    typeof rule.requirement === "string"
  );
}

function validateMinuteBar(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const bar = value as Record<string, unknown>;
  return (
    typeof bar.time === "string" &&
    validNumber(bar.open) &&
    validNumber(bar.high) &&
    validNumber(bar.low) &&
    validNumber(bar.close) &&
    (bar.volume === undefined || validNumber(bar.volume))
  );
}

function validateStrategy(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  const strategy = value as Record<string, unknown>;

  const validOptionalString = (candidate: unknown) =>
    candidate === undefined || typeof candidate === "string";

  return (
    validOptionalString(strategy.strategyName) &&
    validOptionalString(strategy.strategyStatus) &&
    validOptionalString(strategy.detail) &&
    validOptionalString(strategy.rejectionReason) &&
    validOptionalNumber(strategy.atr) &&
    validOptionalNumber(strategy.openingOpen) &&
    validOptionalNumber(strategy.openingHigh) &&
    validOptionalNumber(strategy.openingLow) &&
    validOptionalNumber(strategy.openingClose) &&
    validOptionalNumber(strategy.candleRange) &&
    validOptionalNumber(strategy.atrThreshold) &&
    validOptionalNumber(strategy.rewardRisk) &&
    validOptionalString(strategy.confirmationTime) &&
    validOptionalNumber(strategy.retracementPrice) &&
    validOptionalNumber(strategy.impulseAtrMultiple) &&
    validOptionalNumber(strategy.pullbackVolumeRatio) &&
    (
      strategy.isManipulation === undefined ||
      typeof strategy.isManipulation === "boolean"
    ) &&
    (
      strategy.isRed === undefined ||
      typeof strategy.isRed === "boolean"
    )
  );
}

function validateOutcome(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const outcome = value as Record<string, unknown>;
  return (
    ["WIN", "LOSS", "NO ENTRY", "STILL OPEN"].includes(
      String(outcome.status),
    ) &&
    (outcome.entryTime === undefined ||
      typeof outcome.entryTime === "string") &&
    (outcome.exitTime === undefined ||
      typeof outcome.exitTime === "string") &&
    validOptionalNumber(outcome.entryPrice) &&
    validOptionalNumber(outcome.exitPrice) &&
    validOptionalNumber(outcome.pnlPerShare) &&
    validOptionalNumber(outcome.returnPct) &&
    (outcome.detail === undefined || typeof outcome.detail === "string")
  );
}

function validateWebullPreview(value: unknown) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  const preview = value as Record<string, unknown>;

  const validQuantity =
    preview.quantity === undefined ||
    (
      Number.isInteger(preview.quantity) &&
      Number(preview.quantity) > 0
    );

  const validSizingConstraint =
    preview.sizingConstraint === undefined ||
    (
      typeof preview.sizingConstraint === "string" &&
      /^(RISK_BUDGET|MAX_SHARES|POSITION_VALUE)(\+(RISK_BUDGET|MAX_SHARES|POSITION_VALUE))*$/.test(
        preview.sizingConstraint,
      )
    );

  const positionValueWithinCap =
    preview.estimatedPositionValue === undefined ||
    preview.maxPositionValue === undefined ||
    (
      validNumber(preview.estimatedPositionValue) &&
      validNumber(preview.maxPositionValue) &&
      preview.estimatedPositionValue <=
        preview.maxPositionValue + 0.01
    );

  return (
    typeof preview.status === "string" &&
    preview.submitted === false &&
    validQuantity &&
    validOptionalNumber(preview.limitBuy) &&
    validOptionalNumber(preview.target) &&
    validOptionalNumber(preview.tradingStopLoss) &&
    validOptionalNumber(preview.riskPerShare) &&
    validOptionalNumber(preview.plannedRisk) &&
    validOptionalNumber(
      preview.estimatedPositionValue,
    ) &&
    validOptionalNumber(preview.maxPositionValue) &&
    validSizingConstraint &&
    validOptionalNumber(preview.estimatedCost) &&
    validOptionalNumber(
      preview.estimatedTransactionFee,
    ) &&
    (
      preview.currency === undefined ||
      typeof preview.currency === "string"
    ) &&
    (
      preview.error === undefined ||
      typeof preview.error === "string"
    ) &&
    positionValueWithinCap
  );
}

function validateSymbolReliability(value: unknown) {
  if (!value || typeof value !== "object") return false;

  const reliability = value as Record<string, unknown>;

  return (
    typeof reliability.symbol === "string" &&
    validNumber(reliability.completeness) &&
    reliability.completeness >= 0 &&
    reliability.completeness <= 1 &&
    Number.isInteger(reliability.usableDays) &&
    Number(reliability.usableDays) >= 0 &&
    Number.isInteger(reliability.totalBars) &&
    Number(reliability.totalBars) >= 0 &&
    Number.isInteger(reliability.expectedBars) &&
    Number(reliability.expectedBars) >= 0 &&
    [
      "SELECTED",
      "EXCLUDED_LOW_RELIABILITY",
      "NOT_SELECTED_RANKING_LIMIT",
      "FALLBACK_INSUFFICIENT_HISTORY",
    ].includes(String(reliability.status))
  );
}

function validateSymbol(value: unknown): value is SessionSymbol {
  if (!value || typeof value !== "object") return false;
  const symbol = value as Partial<SessionSymbol>;
  const validSignal = ["INVEST", "NO INVEST", "WARNING"].includes(
    String(symbol.signal),
  );
  const validLevels =
    symbol.levels === undefined ||
    (validNumber(symbol.levels.buy) &&
      validNumber(symbol.levels.target) &&
      validNumber(symbol.levels.stop) &&
      validNumber(symbol.levels.tradingStop));
  const validRules =
    symbol.rules === undefined ||
    (Array.isArray(symbol.rules) && symbol.rules.every(validateRule));
  const validMinuteBars =
    symbol.minuteBars === undefined ||
    (Array.isArray(symbol.minuteBars) &&
      symbol.minuteBars.length <= 100 &&
      symbol.minuteBars.every(validateMinuteBar));

  return (
    typeof symbol.symbol === "string" &&
    validSignal &&
    Number.isInteger(symbol.barsProcessed) &&
    Number.isInteger(symbol.barsExpected) &&
    typeof symbol.detail === "string" &&
    validLevels &&
    validRules &&
    validMinuteBars &&
    validateStrategy(symbol.strategy) &&
    validateOutcome(symbol.outcome) &&
    validateWebullPreview(symbol.webullPreview)
  );
}

function validateProductionHealth(
  value: unknown,
): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  const health = value as Record<string, unknown>;

  return (
    ["MANUAL", "SCHEDULED", "REPLAY"].includes(
      String(health.runMode),
    ) &&
    ["COMPLETED", "FAILED"].includes(
      String(health.workflowStatus),
    ) &&
    typeof health.marketDay === "boolean" &&
    ["HEALTHY", "WARNING"].includes(
      String(health.dataStatus),
    )
  );
}

function validateSession(value: unknown): value is TradingSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<TradingSession>;
  return (
    typeof session.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(session.tradingDate)) &&
    (
      session.source === "REPLAY" ||
      session.source === "LIVE" ||
      session.source === "LIVE_MANIPULATION" ||
      session.source === "LIVE_FIBONACCI" ||
      session.source === "LIVE_FIBONACCI_FINAL"
    ) &&
    ["IEX", "SIP"].includes(String(session.dataFeed)) &&
    (session.status === "COMPLETE" || session.status === "INCOMPLETE") &&
    !Number.isNaN(Date.parse(String(session.updatedAt))) &&
    Array.isArray(session.symbols) &&
    session.symbols.length > 0 &&
    session.symbols.every(validateSymbol) &&
    validateProductionHealth(
      session.productionHealth,
    ) &&
    validatePaperPerformance(
      session.paperPerformance,
    ) &&
    validateWebullApprovals(
      session.webullApprovals,
    ) &&
    validateWebullSafety(
      session.webullSafety,
    ) &&
    (
      session.symbolReliability === undefined ||
      (
        Array.isArray(session.symbolReliability) &&
        session.symbolReliability.every(
          validateSymbolReliability,
        )
      )
    )
  );
}

export async function GET() {
  try {
    return NextResponse.json({ session: await latestSession() });
  } catch {
    return NextResponse.json(
      { error: "Session data is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const env = getDashboardRuntimeEnv();
  const configuredKey = env.DASHBOARD_INGEST_KEY;
  const suppliedKey = request.headers.get("x-dashboard-key");

  if (!configuredKey || suppliedKey !== configuredKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let candidate: unknown;
  try {
    candidate = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!validateSession(candidate)) {
    const rawSession =
      candidate && typeof candidate === "object"
        ? (candidate as Record<string, unknown>)
        : null;

    const rawSymbols = Array.isArray(rawSession?.symbols)
      ? rawSession.symbols
      : [];

    const invalidSymbols = rawSymbols.map((symbol, index) => ({
      index,
      symbol:
        symbol && typeof symbol === "object"
          ? String((symbol as Record<string, unknown>).symbol)
          : "unknown",
      valid: validateSymbol(symbol),
      payload: symbol,
    })).filter((entry) => !entry.valid);

    return NextResponse.json(
      {
        error: "Session payload failed validation.",
        sessionFields: rawSession,
        invalidSymbols,
      },
      { status: 422 },
    );
  }

  const session = suppressUnsafeLevels(candidate);
  await saveSession(session);

  return NextResponse.json({
    accepted: true,
    id: session.id,
    status: session.status,
  });
}
