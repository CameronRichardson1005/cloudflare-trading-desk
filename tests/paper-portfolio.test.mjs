import test from "node:test";
import assert from "node:assert/strict";

import {
  validatePaperPortfolio,
} from "../db/paper-portfolio-safety.ts";

function portfolio(overrides = {}) {
  return {
    startingCash: 10000,
    cash: 9965,
    buyingPower: 9965,
    openCostBasis: 40,
    marketValue: 42,
    realizedPnl: 5,
    unrealizedPnl: 2,
    totalPnl: 7,
    equity: 10007,
    openPositionCount: 1,
    closedPositionCount: 1,
    pendingOrderCount: 0,
    noEntryCount: 0,
    overdrawn: false,
    openPositions: [
      {
        paperOrderId: "paper-open",
        symbol: "BBAI",
        quantity: 10,
        fillPrice: 4,
        costBasis: 40,
        markPrice: 4.2,
        markStatus: "MARKED",
        marketValue: 42,
        unrealizedPnl: 2,
        unrealizedReturnPct: 5,
        filledAt: "2026-08-07T14:01:00Z",
        targetPrice: 4.5,
        stopPrice: 3.8,
      },
    ],
    closedPositions: [
      {
        paperOrderId: "paper-closed",
        symbol: "OPEN",
        quantity: 10,
        fillPrice: 4,
        exitPrice: 4.5,
        realizedPnl: 5,
        returnPct: 12.5,
        exitReason: "TARGET",
        filledAt: "2026-08-07T14:00:00Z",
        closedAt: "2026-08-07T14:05:00Z",
      },
    ],
    simulationOnly: true,
    brokerSubmitted: false,
    ...overrides,
  };
}

test("accepts valid simulated portfolio", () => {
  assert.equal(
    validatePaperPortfolio(portfolio()),
    true,
  );
});

test("allows missing portfolio for legacy sessions", () => {
  assert.equal(
    validatePaperPortfolio(undefined),
    true,
  );
});

test("rejects broker submitted claim", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ brokerSubmitted: true }),
    ),
    false,
  );
});

test("rejects non-simulation portfolio", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ simulationOnly: false }),
    ),
    false,
  );
});

test("rejects inconsistent total pnl", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ totalPnl: 999 }),
    ),
    false,
  );
});

test("rejects inconsistent equity", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ equity: 999 }),
    ),
    false,
  );
});

test("rejects incorrect open position count", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ openPositionCount: 2 }),
    ),
    false,
  );
});

test("rejects negative buying power", () => {
  assert.equal(
    validatePaperPortfolio(
      portfolio({ buyingPower: -1 }),
    ),
    false,
  );
});


test("accepts valid paper portfolio risk status", async () => {
  const { validatePaperPortfolio } = await import(
    "../db/paper-portfolio-safety.ts"
  );

  const candidate = portfolio();

  candidate.risk = {
    tradingAllowed: true,
    reason: "PAPER_TRADING_ALLOWED",
    availableForNewOrders: 9850,
    pendingReservedCash: 100,
    dailyRealizedPnl: -10,
    maxDailyLoss: 50,
    remainingDailyLoss: 40,
    simulationOnly: true,
    brokerSubmitted: false,
  };

  assert.equal(validatePaperPortfolio(candidate), true);
});


test("accepts missing legacy paper risk status", async () => {
  const { validatePaperPortfolio } = await import(
    "../db/paper-portfolio-safety.ts"
  );

  const candidate = portfolio();

  delete candidate.risk;

  assert.equal(validatePaperPortfolio(candidate), true);
});


test("rejects broker-submitted paper risk status", async () => {
  const { validatePaperPortfolio } = await import(
    "../db/paper-portfolio-safety.ts"
  );

  const candidate = portfolio();

  candidate.risk = {
    tradingAllowed: true,
    reason: "PAPER_TRADING_ALLOWED",
    availableForNewOrders: 9850,
    pendingReservedCash: 100,
    dailyRealizedPnl: -10,
    maxDailyLoss: 50,
    remainingDailyLoss: 40,
    simulationOnly: true,
    brokerSubmitted: true,
  };

  assert.equal(validatePaperPortfolio(candidate), false);
});


test("rejects inconsistent daily-loss halt state", async () => {
  const { validatePaperPortfolio } = await import(
    "../db/paper-portfolio-safety.ts"
  );

  const candidate = portfolio();

  candidate.risk = {
    tradingAllowed: true,
    reason: "PAPER_DAILY_LOSS_LIMIT_REACHED",
    availableForNewOrders: 9850,
    pendingReservedCash: 0,
    dailyRealizedPnl: -50,
    maxDailyLoss: 50,
    remainingDailyLoss: 0,
    simulationOnly: true,
    brokerSubmitted: false,
  };

  assert.equal(validatePaperPortfolio(candidate), false);
});


test("rejects remaining loss above configured limit", async () => {
  const { validatePaperPortfolio } = await import(
    "../db/paper-portfolio-safety.ts"
  );

  const candidate = portfolio();

  candidate.risk = {
    tradingAllowed: true,
    reason: "PAPER_TRADING_ALLOWED",
    availableForNewOrders: 9850,
    pendingReservedCash: 0,
    dailyRealizedPnl: 10,
    maxDailyLoss: 50,
    remainingDailyLoss: 60,
    simulationOnly: true,
    brokerSubmitted: false,
  };

  assert.equal(validatePaperPortfolio(candidate), false);
});
