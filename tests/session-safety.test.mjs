import assert from "node:assert/strict";
import test from "node:test";
import { suppressUnsafeLevels } from "../db/session-safety.ts";

test("keeps complete symbol signals in an incomplete session", () => {
  const session = suppressUnsafeLevels({
    id: "replay-2026-07-23",
    tradingDate: "2026-07-23",
    source: "REPLAY",
    dataFeed: "SIP",
    status: "INCOMPLETE",
    updatedAt: "2026-07-23T16:00:00Z",
    symbols: [
      {
        symbol: "RIVN",
        signal: "INVEST",
        barsProcessed: 15,
        barsExpected: 15,
        detail: "complete",
        levels: {
          buy: 16.65,
          target: 16.78,
          stop: 16.58,
          tradingStop: 16.53,
        },
        outcome: {
          status: "WIN",
          entryPrice: 16.65,
          exitPrice: 16.78,
          pnlPerShare: 0.13,
          returnPct: 0.78,
        },
      },
      {
        symbol: "BBAI",
        signal: "NO INVEST",
        barsProcessed: 12,
        barsExpected: 15,
        detail: "incomplete: 12/15 bars",
      },
    ],
  });

  assert.equal(session.status, "INCOMPLETE");
  assert.equal(session.symbols[0].signal, "INVEST");
  assert.deepEqual(session.symbols[0].levels, {
    buy: 16.65,
    target: 16.78,
    stop: 16.58,
    tradingStop: 16.53,
  });
  assert.equal(session.symbols[0].outcome.status, "WIN");
  assert.equal(session.symbols[1].signal, "WARNING");
  assert.equal(session.symbols[1].levels, undefined);
  assert.equal(session.symbols[1].outcome, undefined);
});

test("removes outcomes from symbols that did not issue an INVEST signal", () => {
  const session = suppressUnsafeLevels({
    id: "replay-2026-07-24",
    tradingDate: "2026-07-24",
    source: "REPLAY",
    dataFeed: "SIP",
    status: "COMPLETE",
    updatedAt: "2026-07-24T16:00:00Z",
    symbols: [
      {
        symbol: "OPEN",
        signal: "NO INVEST",
        barsProcessed: 15,
        barsExpected: 15,
        detail: "complete",
        outcome: {
          status: "WIN",
          pnlPerShare: 1,
        },
      },
    ],
  });

  assert.equal(session.symbols[0].signal, "NO INVEST");
  assert.equal(session.symbols[0].outcome, undefined);
});

test("keeps Fibonacci INVEST levels after more than fifteen bars", () => {
  const session = suppressUnsafeLevels({
    id: "live_fibonacci-2026-08-03",
    tradingDate: "2026-08-03",
    source: "LIVE_FIBONACCI",
    dataFeed: "SIP",
    status: "COMPLETE",
    updatedAt: "2026-08-03T14:08:00Z",
    symbols: [
      {
        symbol: "OPEN",
        signal: "INVEST",
        barsProcessed: 38,
        barsExpected: 15,
        detail: "complete",
        levels: {
          buy: 4.25,
          target: 4.6,
          stop: 4.1,
          tradingStop: 4.1,
        },
        strategy: {
          strategyName: "FIBONACCI_61_8",
          strategyStatus:
            "ACTIVE PAPER/PREVIEW — NOT SUBMITTED",
          rewardRisk: 2.33,
          confirmationTime: "10:08",
          retracementPrice: 4.18,
          impulseAtrMultiple: 0.72,
          pullbackVolumeRatio: 0.64,
        },
      },
    ],
  });

  assert.equal(session.status, "COMPLETE");
  assert.equal(session.symbols[0].signal, "INVEST");
  assert.deepEqual(session.symbols[0].levels, {
    buy: 4.25,
    target: 4.6,
    stop: 4.1,
    tradingStop: 4.1,
  });
});


test("keeps Fibonacci rejection details while suppressing levels", () => {
  const session = suppressUnsafeLevels({
    id: "live_fibonacci-2026-08-03",
    tradingDate: "2026-08-03",
    source: "LIVE_FIBONACCI",
    dataFeed: "SIP",
    status: "COMPLETE",
    updatedAt: "2026-08-03T14:08:00Z",
    symbols: [
      {
        symbol: "PLTR",
        signal: "NO INVEST",
        barsProcessed: 38,
        barsExpected: 15,
        detail: "complete",
        levels: {
          buy: 150,
          target: 155,
          stop: 148,
          tradingStop: 148,
        },
        strategy: {
          strategyName: "FIBONACCI_61_8",
          rejectionReason:
            "REWARD_RISK_BELOW_MINIMUM",
          detail:
            "Reward/risk was below the 1.50 minimum.",
        },
      },
    ],
  });

  assert.equal(
    session.symbols[0].strategy.rejectionReason,
    "REWARD_RISK_BELOW_MINIMUM",
  );
  assert.equal(session.symbols[0].levels, undefined);
  assert.equal(session.symbols[0].signal, "NO INVEST");
});
