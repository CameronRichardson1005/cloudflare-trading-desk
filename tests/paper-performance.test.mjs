import assert from "node:assert/strict";
import test from "node:test";

import {
  validatePaperPerformance,
} from "../db/paper-performance-safety.ts";


function validReport() {
  return {
    date: "2026-08-07",
    ordersApproved: 5,
    tradesEntered: 4,
    openTrades: 0,
    closedTrades: 4,
    noEntry: 1,
    targetExits: 2,
    stopExits: 1,
    timeExits: 1,
    profitableTrades: 3,
    losingTrades: 1,
    breakevenTrades: 0,
    winRatePct: 75,
    realizedPnl: 8.42,
    averagePnlPerTrade: 2.105,
    averageReturnPct: 1.84,
    averageWinner: 3.47,
    averageLoser: -1.99,
    expectancyPerTrade: 2.105,
    averageMfePct: 3.4,
    averageMaePct: -1.1,
    bestTrade: {
      symbol: "OPEN",
      pnl: 4.5,
    },
    worstTrade: {
      symbol: "SOUN",
      pnl: -1.99,
    },
    simulationOnly: true,
    brokerSubmitted: false,
  };
}


test("accepts valid local paper performance", () => {
  assert.equal(
    validatePaperPerformance(validReport()),
    true,
  );
});


test("allows missing performance for older sessions", () => {
  assert.equal(
    validatePaperPerformance(undefined),
    true,
  );
});


test("rejects broker-submitted claim", () => {
  const report = validReport();
  report.brokerSubmitted = true;

  assert.equal(
    validatePaperPerformance(report),
    false,
  );
});


test("rejects non-simulation report", () => {
  const report = validReport();
  report.simulationOnly = false;

  assert.equal(
    validatePaperPerformance(report),
    false,
  );
});


test("rejects invalid win rate", () => {
  const report = validReport();
  report.winRatePct = 125;

  assert.equal(
    validatePaperPerformance(report),
    false,
  );
});


test("rejects closed trades above entered trades", () => {
  const report = validReport();
  report.closedTrades = 5;

  assert.equal(
    validatePaperPerformance(report),
    false,
  );
});


test("rejects entered trades above approved orders", () => {
  const report = validReport();
  report.tradesEntered = 6;

  assert.equal(
    validatePaperPerformance(report),
    false,
  );
});


test("accepts zero-trade daily report", () => {
  const report = validReport();

  Object.assign(report, {
    ordersApproved: 0,
    tradesEntered: 0,
    openTrades: 0,
    closedTrades: 0,
    noEntry: 0,
    targetExits: 0,
    stopExits: 0,
    timeExits: 0,
    profitableTrades: 0,
    losingTrades: 0,
    breakevenTrades: 0,
    winRatePct: null,
    realizedPnl: 0,
    averagePnlPerTrade: null,
    averageReturnPct: null,
    averageWinner: null,
    averageLoser: null,
    expectancyPerTrade: null,
    averageMfePct: null,
    averageMaePct: null,
    bestTrade: {
      symbol: null,
      pnl: null,
    },
    worstTrade: {
      symbol: null,
      pnl: null,
    },
  });

  assert.equal(
    validatePaperPerformance(report),
    true,
  );
});
