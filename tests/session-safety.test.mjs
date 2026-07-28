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
