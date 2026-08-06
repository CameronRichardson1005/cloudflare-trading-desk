"use client";

import { useEffect, useState } from "react";

type DashboardSymbol = {
  symbol: string;
  signal: "INVEST" | "NO INVEST" | "WARNING";
  barsProcessed: number;
  barsExpected: number;
  detail: string;
  levels?: {
    buy: number;
    target: number;
    stop: number;
    tradingStop: number;
  };
  rules?: {
    label: string;
    passed: boolean;
    actual: string;
    requirement: string;
  }[];
  strategy?: {
    strategyName?: string;
    strategyStatus?: string;
    detail?: string;
    rejectionReason?: string;
    atr?: number;
    openingOpen?: number;
    openingHigh?: number;
    openingLow?: number;
    openingClose?: number;
    candleRange?: number;
    atrThreshold?: number;
    rewardRisk?: number;
    confirmationTime?: string;
    retracementPrice?: number;
    impulseAtrMultiple?: number;
    pullbackVolumeRatio?: number;
    isManipulation?: boolean;
    isRed?: boolean;
  };
  minuteBars?: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }[];
  outcome?: {
    status: "WIN" | "LOSS" | "NO ENTRY" | "STILL OPEN";
    entryTime?: string;
    exitTime?: string;
    entryPrice?: number;
    exitPrice?: number;
    pnlPerShare?: number;
    returnPct?: number;
    detail?: string;
  };
  webullPreview?: {
    status: string;
    submitted: false;
    quantity?: number;
    limitBuy?: number;
    target?: number;
    tradingStopLoss?: number;
    riskPerShare?: number;
    plannedRisk?: number;
    estimatedPositionValue?: number;
    maxPositionValue?: number;
    sizingConstraint?: string;
    estimatedCost?: number;
    estimatedTransactionFee?: number;
    currency?: string;
    error?: string;
  };
};

type SymbolReliability = {
  symbol: string;
  completeness: number;
  usableDays: number;
  totalBars: number;
  expectedBars: number;
  status:
    | "SELECTED"
    | "EXCLUDED_LOW_RELIABILITY"
    | "NOT_SELECTED_RANKING_LIMIT"
    | "FALLBACK_INSUFFICIENT_HISTORY";
};

type ProductionHealth = {
  runMode: "MANUAL" | "SCHEDULED" | "REPLAY";
  workflowStatus: "COMPLETED" | "FAILED";
  marketDay: boolean;
  dataStatus: "HEALTHY" | "WARNING";
};

type FibonacciPaperMetrics = {
  qualifyingSetups: number;
  closedTrades: number;
  wins: number;
  losses: number;
  winRatePct: number | null;
  profitFactor: number | null;
  averageReturnPct: number | null;
  cumulativeReturnPct: number;
};

type FibonacciPaperStatus = {
  tradingDate: string;
  updatedAt: string;
  todayCompleted: boolean;
  safetyStatus: "PAPER ONLY — NOT SUBMITTED";
  forward: FibonacciPaperMetrics;
  latestForwardSetup: {
    tradingDate: string;
    symbol: string;
    fibonacciLevel: string;
    outcome: "WIN" | "LOSS";
    netReturnPct: number;
    submitted: "NO";
  } | null;
};

type DashboardSession = {
  id: string;
  tradingDate: string;
  source:
    | "REPLAY"
    | "LIVE"
    | "LIVE_MANIPULATION"
    | "LIVE_FIBONACCI"
    | "LIVE_FIBONACCI_FINAL";
  dataFeed: "IEX" | "SIP";
  status: "COMPLETE" | "INCOMPLETE";
  updatedAt: string;
  symbols: DashboardSymbol[];
  symbolReliability?: SymbolReliability[];
  productionHealth?: ProductionHealth;
};

const fallbackSession: DashboardSession = {
  id: "replay-2026-07-23",
  tradingDate: "2026-07-23",
  source: "REPLAY",
  dataFeed: "SIP",
  status: "INCOMPLETE",
  updatedAt: "2026-07-23T12:07:08-04:00",
  symbols: [
  {
    symbol: "RIVN",
    signal: "INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
    levels: {
      buy: 16.65,
      target: 16.7837,
      stop: 16.5832,
      tradingStop: 16.5332,
    },
  },
  {
    symbol: "PLTR",
    signal: "INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
    levels: {
      buy: 121.64,
      target: 123.4392,
      stop: 120.7404,
      tradingStop: 120.6904,
    },
  },
  {
    symbol: "PINS",
    signal: "INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
    levels: {
      buy: 21.97,
      target: 22.1304,
      stop: 21.8898,
      tradingStop: 21.8398,
    },
  },
  {
    symbol: "OPEN",
    signal: "NO INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
  },
  {
    symbol: "SOUN",
    signal: "NO INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
  },
  {
    symbol: "SOFI",
    signal: "NO INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
  },
  {
    symbol: "SNAP",
    signal: "NO INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
  },
  {
    symbol: "RGTI",
    signal: "NO INVEST",
    barsProcessed: 15,
    barsExpected: 15,
    detail: "Complete",
  },
  {
    symbol: "BBAI",
    signal: "WARNING",
    barsProcessed: 12,
    barsExpected: 15,
    detail: "ATR unavailable",
  },
  ],
};

function formatTradingDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function formatUpdatedTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

type SessionFreshnessStatus = "current" | "stale" | "checking";

type SessionFreshness = {
  status: SessionFreshnessStatus;
  title: string;
  message: string;
  ageLabel: string;
  dateMatches: boolean;
  apiVerified: boolean;
  finalEvaluationReceived: boolean;
};

function newYorkDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/New_York",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatSessionAge(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "Update time unavailable";
  }

  const minutes = Math.floor(milliseconds / 60000);

  if (minutes < 1) {
    return "Updated less than a minute ago";
  }

  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? "" : "s"}${
      remainingMinutes
        ? ` ${remainingMinutes} minute${
            remainingMinutes === 1 ? "" : "s"
          }`
        : ""
    } ago`;
  }

  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
}

function getSessionFreshness({
  session,
  dataState,
  now,
}: {
  session: DashboardSession;
  dataState: "loading" | "current" | "fallback";
  now: Date | null;
}): SessionFreshness {
  const finalEvaluationReceived =
    session.source === "LIVE_FIBONACCI_FINAL";

  if (!now || dataState === "loading") {
    return {
      status: "checking",
      title: "Session check in progress",
      message:
        "The dashboard is verifying the latest stored trading session.",
      ageLabel: "Checking latest update",
      dateMatches: false,
      apiVerified: false,
      finalEvaluationReceived,
    };
  }

  const marketDate = newYorkDateKey(now);
  const dateMatches = session.tradingDate === marketDate;
  const apiVerified = dataState === "current";
  const updatedAt = new Date(session.updatedAt);
  const updatedTimestamp = updatedAt.getTime();
  const timestampValid = Number.isFinite(updatedTimestamp);
  const ageMilliseconds = timestampValid
    ? now.getTime() - updatedTimestamp
    : Number.NaN;
  const ageHours = ageMilliseconds / 3600000;
  const ageLabel = formatSessionAge(ageMilliseconds);

  if (!apiVerified) {
    return {
      status: "stale",
      title: "Fallback session displayed",
      message: `This is the verified fallback snapshot from ${
        session.tradingDate
      }, not a confirmed current API session. Do not use these values for today's trading decisions.`,
      ageLabel,
      dateMatches,
      apiVerified,
      finalEvaluationReceived,
    };
  }

  if (!dateMatches) {
    return {
      status: "stale",
      title: "Stale trading session",
      message: `The dashboard is showing ${
        session.tradingDate
      } data, but the current New York market date is ${marketDate}. Do not use these values for today's trading decisions.`,
      ageLabel,
      dateMatches,
      apiVerified,
      finalEvaluationReceived,
    };
  }

  if (!timestampValid) {
    return {
      status: "stale",
      title: "Session timestamp invalid",
      message:
        "The dashboard could not verify when this session was last updated. Treat all displayed values as historical.",
      ageLabel: "Invalid update timestamp",
      dateMatches,
      apiVerified,
      finalEvaluationReceived,
    };
  }

  if (ageHours > 18) {
    return {
      status: "stale",
      title: "Session update is too old",
      message:
        "The trading date matches today, but the latest update is more than 18 hours old. Do not rely on this session until a new run is published.",
      ageLabel,
      dateMatches,
      apiVerified,
      finalEvaluationReceived,
    };
  }

  return {
    status: "current",
    title: "Current session verified",
    message: `This session belongs to today's New York market date and was loaded from the dashboard API.`,
    ageLabel,
    dateMatches,
    apiVerified,
    finalEvaluationReceived,
  };
}

type RejectionDefinition = {
  title: string;
  explanation: string;
  nextStep: string;
};

function rejectionDefinition(
  code?: string | null,
): RejectionDefinition {
  const normalized = code?.trim().toUpperCase() ?? "";

  const definitions: Record<string, RejectionDefinition> = {
    NO_QUALIFYING_UPWARD_IMPULSE: {
      title: "No qualifying upward impulse",
      explanation:
        "The initial upward price move was not large or clear enough to satisfy the Fibonacci strategy's impulse requirement.",
      nextStep:
        "Wait for a stronger upward move that meets the configured ATR and structure requirements.",
    },
    RETRACEMENT_ZONE_NOT_TOUCHED: {
      title: "Retracement zone not touched",
      explanation:
        "Price did not return to the required Fibonacci retracement area after the upward impulse.",
      nextStep:
        "The strategy remains inactive unless price reaches the configured retracement zone.",
    },
    REWARD_RISK_BELOW_MINIMUM: {
      title: "Reward-to-risk below minimum",
      explanation:
        "The expected profit available between entry and target was too small compared with the planned loss at the trading stop.",
      nextStep:
        "A trade can qualify only when its projected reward-to-risk ratio meets the configured minimum.",
    },
    NO_BULLISH_CONFIRMATION: {
      title: "No bullish confirmation",
      explanation:
        "Price reached the setup area, but the required bullish confirmation pattern was not present.",
      nextStep:
        "Wait for the configured confirmation signal before treating the setup as valid.",
    },
    PULLBACK_VOLUME_TOO_HIGH: {
      title: "Pullback volume too high",
      explanation:
        "Selling volume during the pullback was stronger than the strategy permits.",
      nextStep:
        "A healthier retracement should occur with controlled or declining pullback volume.",
    },
    OPENING_DATA_INCOMPLETE: {
      title: "Opening data incomplete",
      explanation:
        "One or more required opening bars were unavailable, so the strategy could not evaluate the symbol reliably.",
      nextStep:
        "Review the data feed and missing-bar record before relying on this symbol's result.",
    },
    ATR_UNAVAILABLE: {
      title: "ATR unavailable",
      explanation:
        "There was not enough valid historical data to calculate the required average true range.",
      nextStep:
        "The symbol needs sufficient historical bars before the strategy can evaluate it.",
    },
    INVALID_TRADE_LEVELS: {
      title: "Invalid trade levels",
      explanation:
        "The calculated entry, target, or trading-stop levels did not form a valid trade structure.",
      nextStep:
        "The setup must produce an entry above the stop and a target with sufficient upside.",
    },
    PRICE_ABOVE_ENTRY_LIMIT: {
      title: "Price above entry limit",
      explanation:
        "Price moved beyond the strategy's acceptable entry range before a valid entry could be recorded.",
      nextStep:
        "Do not chase the move. Wait for another qualifying setup.",
    },
    NO_ENTRY_TRIGGER: {
      title: "No entry trigger",
      explanation:
        "The strategy conditions were evaluated, but price never produced the required entry event.",
      nextStep:
        "The setup remains NO INVEST unless the configured entry trigger occurs within the monitoring window.",
    },
  };

  if (definitions[normalized]) {
    return definitions[normalized];
  }

  const readableTitle = normalized
    ? normalized
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/(^|\s)\S/g, (character) =>
          character.toUpperCase(),
        )
    : "Strategy requirements not met";

  return {
    title: readableTitle,
    explanation:
      "The symbol did not satisfy every requirement of the active Fibonacci strategy.",
    nextStep:
      "Review the rule checklist to see which measured condition failed.",
  };
}

function diagnosisExplanation(stock: DashboardSymbol) {
  const strategyName =
    stock.strategy?.strategyName?.toUpperCase() ?? "";

  if (stock.signal === "WARNING") {
    return (
      `${stock.symbol} could not receive a dependable strategy decision ` +
      `because the required market data was incomplete or unavailable. ` +
      `${stock.barsProcessed} of ${stock.barsExpected} opening bars were received.`
    );
  }

  if (stock.signal === "INVEST") {
    const passedRules =
      stock.rules
        ?.filter((rule) => rule.passed)
        .map((rule) => rule.label) ?? [];

    if (passedRules.length > 0) {
      return (
        `${stock.symbol} was selected because it passed the available ` +
        `strategy checks: ${passedRules.join(", ")}. Complete entry, target, ` +
        `and protective stop levels were produced.`
      );
    }

    if (strategyName.includes("FIBONACCI")) {
      return (
        `${stock.symbol} was selected because the strategy identified a valid ` +
        `upward impulse, a pullback into the 61.8% Fibonacci retracement area, ` +
        `acceptable pullback volume, bullish confirmation, and sufficient ` +
        `reward compared with the planned risk.`
      );
    }

    return (
      `${stock.symbol} was selected because it satisfied the active strategy ` +
      `requirements and produced verified entry, target-sell, structural-stop, ` +
      `and trading-stop levels.`
    );
  }

  const rejection =
    stock.strategy?.rejectionReason
      ?.replaceAll("_", " ")
      .toLowerCase();

  const detail = stock.strategy?.detail;

  if (rejection || detail) {
    return (
      `${stock.symbol} was not selected because ` +
      `${detail || rejection}.`
    );
  }

  return (
    `${stock.symbol} was not selected because one or more requirements of ` +
    `the active strategy were not satisfied. No order was submitted.`
  );
}


function Mark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span>C</span>
      <span>T</span>
    </div>
  );
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "overview"
    | "signals"
    | "replay"
    | "history"
    | "performance"
    | "audit"
    | "glossary"
    | "comparison"
    | "calendar";
  size?: number;
}) {
  const paths = {
    overview: (
      <>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5M9 21v-7h6v7" />
      </>
    ),
    signals: <path d="M2 12h4l2.2-7 4.1 14 2.2-7H22" />,
    replay: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="m10 8 6 4-6 4V8Z" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5M12 7v5l3 2" />
      </>
    ),
    performance: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
        <path d="M2 20h22" />
      </>
    ),
    audit: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    glossary: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
        <path d="M7 7h2M15 7h2M7 11h2M15 11h2" />
      </>
    ),
    comparison: (
      <>
        <path d="M7 7h12" />
        <path d="m16 4 3 3-3 3" />
        <path d="M17 17H5" />
        <path d="m8 14-3 3 3 3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7">
        {paths[name]}
      </g>
    </svg>
  );
}

type MetricIconName =
  | "complete"
  | "bars"
  | "invest"
  | "warning";

function MetricIcon({
  name,
}: {
  name: MetricIconName;
}) {
  const paths = {
    complete: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.5 12.2 2.2 2.2 4.8-5" />
      </>
    ),
    bars: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M9 5v14M15 5v14" />
      </>
    ),
    invest: (
      <>
        <path d="M5 17 17 5" />
        <path d="M10 5h7v7" />
        <path d="M5 12v5h5" />
      </>
    ),
    warning: (
      <>
        <path d="M12 4 21 20H3L12 4Z" />
        <path d="M12 9v5" />
        <path d="M12 17.2h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="26"
      viewBox="0 0 24 24"
      width="26"
    >
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function Metric({
  label,
  value,
  tone,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  value: string;
  tone: MetricIconName;
  icon: MetricIconName;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`metric-card metric-${tone} ${
        active ? "active" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="metric-glyph" aria-hidden="true">
        <MetricIcon name={icon} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <span className="info-dot" aria-hidden="true">
        i
      </span>
    </button>
  );
}

function reliabilityStatusLabel(
  status: SymbolReliability["status"],
) {
  switch (status) {
    case "SELECTED":
      return "Selected";
    case "EXCLUDED_LOW_RELIABILITY":
      return "Excluded — low reliability";
    case "NOT_SELECTED_RANKING_LIMIT":
      return "Not selected — ranking limit";
    case "FALLBACK_INSUFFICIENT_HISTORY":
      return "Fallback — insufficient history";
  }
}

function warningExplanation(stock: DashboardSymbol) {
  const missingBars = Math.max(stock.barsExpected - stock.barsProcessed, 0);
  const detail = stock.detail.trim().toLowerCase();

  if (stock.barsProcessed < stock.barsExpected) {
    return {
      reason: `Missing ${missingBars} one-minute ${missingBars === 1 ? "bar" : "bars"} (${stock.barsProcessed} of ${stock.barsExpected} received).`,
      impact: "The opening candle was incomplete, so the strategy was skipped.",
    };
  }

  if (detail.includes("atr")) {
    return {
      reason: "ATR could not be calculated from the available daily price history.",
      impact: "Risk levels could not be verified, so no signal was issued.",
    };
  }

  if (detail.includes("strategy") || detail.includes("opening")) {
    return {
      reason: stock.detail || "The opening strategy data was unavailable.",
      impact: "The strategy was skipped and no signal was issued.",
    };
  }

  return {
    reason: stock.detail || "The symbol did not pass data validation.",
    impact: "The symbol was excluded from strategy results.",
  };
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function signedMoney(value: number) {
  const formatted = money(Math.abs(value));
  return `${value >= 0 ? "+" : "−"}${formatted}`;
}

function OutcomeBadge({
  outcome,
}: {
  outcome?: DashboardSymbol["outcome"];
}) {
  if (!outcome) {
    return <span className="outcome unavailable">Not calculated</span>;
  }

  return (
    <span
      className={`outcome ${outcome.status.toLowerCase().replace(" ", "-")}`}
    >
      {outcome.status}
    </span>
  );
}

function PriceChart({ stock }: { stock: DashboardSymbol }) {
  const bars = stock.minuteBars ?? [];

  if (bars.length === 0) {
    return (
      <div className="detail-empty">
        <strong>Minute chart unavailable</strong>
        <span>
          This session was uploaded before one-minute candles were added to the
          dashboard export.
        </span>
      </div>
    );
  }

  const levelValues = stock.levels
    ? [stock.levels.buy, stock.levels.target, stock.levels.tradingStop]
    : [];
  const low = Math.min(...bars.map((bar) => bar.low), ...levelValues);
  const high = Math.max(...bars.map((bar) => bar.high), ...levelValues);
  const range = Math.max(high - low, 0.0001);
  const chartWidth = 720;
  const chartHeight = 240;
  const plotTop = 18;
  const plotBottom = 210;
  const xStep = chartWidth / bars.length;
  const y = (price: number) =>
    plotTop + ((high - price) / range) * (plotBottom - plotTop);

  const guides = stock.levels
    ? [
        { label: "Target", value: stock.levels.target, tone: "target" },
        { label: "Buy", value: stock.levels.buy, tone: "buy" },
        {
          label: "Trading stop loss",
          value: stock.levels.tradingStop,
          tone: "stop",
        },
      ]
    : [];

  return (
    <div className="price-chart">
      <svg
        aria-label={`${stock.symbol} one-minute candlestick chart from 09:30 to 09:45`}
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      >
        {[0, 1, 2, 3].map((line) => {
          const lineY = plotTop + (line / 3) * (plotBottom - plotTop);
          return (
            <line
              className="chart-grid"
              key={line}
              x1="0"
              x2={chartWidth}
              y1={lineY}
              y2={lineY}
            />
          );
        })}
        {guides.map((guide) => (
          <g className={`chart-guide ${guide.tone}`} key={guide.label}>
            <line x1="0" x2={chartWidth} y1={y(guide.value)} y2={y(guide.value)} />
            <text x="6" y={y(guide.value) - 5}>
              {guide.label} ${guide.value.toFixed(4)}
            </text>
          </g>
        ))}
        {bars.map((bar, index) => {
          const center = index * xStep + xStep / 2;
          const bodyTop = y(Math.max(bar.open, bar.close));
          const bodyBottom = y(Math.min(bar.open, bar.close));
          const rising = bar.close >= bar.open;
          return (
            <g className={rising ? "candle rising" : "candle falling"} key={`${bar.time}-${index}`}>
              <line x1={center} x2={center} y1={y(bar.high)} y2={y(bar.low)} />
              <rect
                height={Math.max(bodyBottom - bodyTop, 2)}
                width={Math.max(xStep * 0.52, 3)}
                x={center - Math.max(xStep * 0.52, 3) / 2}
                y={bodyTop}
              />
            </g>
          );
        })}
        <text className="chart-time" x="0" y="234">
          {bars[0]?.time}
        </text>
        <text className="chart-time" textAnchor="end" x={chartWidth} y="234">
          {bars[bars.length - 1]?.time}
        </text>
      </svg>
    </div>
  );
}

export default function Home() {
  const [session, setSession] = useState(fallbackSession);
  const [sessions, setSessions] = useState<DashboardSession[]>([
    fallbackSession,
  ]);
  const [dataState, setDataState] = useState<"loading" | "current" | "fallback">(
    "loading",
  );
  const [freshnessNow, setFreshnessNow] = useState<Date | null>(
    null,
  );

  useEffect(() => {
    const refreshClock = () => setFreshnessNow(new Date());

    refreshClock();
    const interval = window.setInterval(refreshClock, 60000);

    return () => window.clearInterval(interval);
  }, []);
  const [activeSection, setActiveSection] = useState<
    | "today"
    | "operations"
    | "overview"
    | "symbols"
    | "diagnosis"
    | "glossary"
    | "comparison"
    | "history"
    | "performance"
    | "replay"
    | "audit"
  >("today");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "complete" | "signals" | "warnings"
  >("signals");
  const [replayStep, setReplayStep] = useState(15);
  const [replayStatus, setReplayStatus] = useState<
    "ready" | "running" | "paused" | "complete"
  >("complete");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [fibonacciPaper, setFibonacciPaper] =
    useState<FibonacciPaperStatus | null>(null);
  const [fibonacciState, setFibonacciState] =
    useState<"loading" | "current" | "unavailable">(
      "loading",
    );

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/sessions", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session request failed.");
        return (await response.json()) as { sessions: DashboardSession[] };
      })
      .then((result) => {
        if (result.sessions.length > 0) {
          setSessions(result.sessions);
          setSession(result.sessions[0]);
          setDataState("current");
        } else {
          setDataState("fallback");
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDataState("fallback");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/fibonacci-paper/latest", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Fibonacci paper request failed.",
          );
        }

        return (await response.json()) as {
          fibonacciPaper:
            FibonacciPaperStatus | null;
        };
      })
      .then((result) => {
        setFibonacciPaper(result.fibonacciPaper);
        setFibonacciState(
          result.fibonacciPaper
            ? "current"
            : "unavailable",
        );
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setFibonacciState("unavailable");
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (replayStatus !== "running") {
      return;
    }

    if (replayStep >= 15) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setReplayStep((current) => {
        const next = current + 1;
        if (next >= 15) {
          setReplayStatus("complete");
        }
        return next;
      });
    }, 420);

    return () => window.clearTimeout(timeout);
  }, [replayStatus, replayStep]);

  const navigateTo = (
    section:
      | "today"
      | "operations"
      | "overview"
      | "symbols"
      | "diagnosis"
      | "glossary"
      | "comparison"
      | "history"
      | "performance"
      | "replay"
      | "audit",
  ) => {
    setActiveSection(section);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showSymbolView = (
    nextFilter: "all" | "complete" | "signals" | "warnings",
  ) => {
    setFilter(nextFilter);
    setActiveSection("symbols");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openStockDiagnosis = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveSection("diagnosis");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startReplay = () => {
    setReplayStep(0);
    setReplayStatus("running");
  };

  const toggleReplay = () => {
    if (replayStatus === "running") {
      setReplayStatus("paused");
      return;
    }

    if (replayStatus === "paused") {
      setReplayStatus("running");
      return;
    }

    startReplay();
  };

  const filteredSymbols = session.symbols.filter((stock) => {
    if (filter === "complete") {
      return stock.signal !== "WARNING";
    }

    if (filter === "signals") {
      return stock.signal === "INVEST";
    }

    if (filter === "warnings") {
      return stock.signal === "WARNING";
    }

    return true;
  });
  const selectedStock =
    session.symbols.find((stock) => stock.symbol === selectedSymbol) ?? null;
  const riskBudget = accountSize * (riskPercent / 100);
  const riskPerShare =
    selectedStock?.levels
      ? Math.max(
          selectedStock.levels.buy - selectedStock.levels.tradingStop,
          0,
        )
      : 0;
  const suggestedShares =
    riskPerShare > 0 ? Math.floor(riskBudget / riskPerShare) : 0;
  const requiredCapital = selectedStock?.levels
    ? suggestedShares * selectedStock.levels.buy
    : 0;
  const maximumLoss = suggestedShares * riskPerShare;
  const potentialProfit = selectedStock?.levels
    ? suggestedShares *
      Math.max(selectedStock.levels.target - selectedStock.levels.buy, 0)
    : 0;
  const rewardRisk = maximumLoss > 0 ? potentialProfit / maximumLoss : 0;
  const outcomeSymbols = sessions.flatMap((storedSession) =>
    storedSession.symbols
      .filter((stock) => stock.signal === "INVEST" && stock.outcome)
      .map((stock) => ({
        ...stock,
        sessionId: storedSession.id,
        tradingDate: storedSession.tradingDate,
        source: storedSession.source,
      })),
  );
  const wins = outcomeSymbols.filter(
    (stock) => stock.outcome?.status === "WIN",
  );
  const losses = outcomeSymbols.filter(
    (stock) => stock.outcome?.status === "LOSS",
  );
  const noEntries = outcomeSymbols.filter(
    (stock) => stock.outcome?.status === "NO ENTRY",
  );
  const openTrades = outcomeSymbols.filter(
    (stock) => stock.outcome?.status === "STILL OPEN",
  );
  const resolvedTrades = wins.length + losses.length;
  const winRate =
    resolvedTrades > 0 ? (wins.length / resolvedTrades) * 100 : 0;
  const totalPnlPerShare = outcomeSymbols.reduce(
    (total, stock) => total + (stock.outcome?.pnlPerShare ?? 0),
    0,
  );
  const averageReturn =
    resolvedTrades > 0
      ? [...wins, ...losses].reduce(
          (total, stock) => total + (stock.outcome?.returnPct ?? 0),
          0,
        ) / resolvedTrades
      : 0;
  const grossProfit = wins.reduce(
    (total, stock) => total + Math.max(stock.outcome?.pnlPerShare ?? 0, 0),
    0,
  );
  const grossLoss = Math.abs(
    losses.reduce(
      (total, stock) => total + Math.min(stock.outcome?.pnlPerShare ?? 0, 0),
      0,
    ),
  );
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;

  const replayTime = `09:${String(30 + replayStep).padStart(2, "0")}`;
  const replayPercent = `${(replayStep / 15) * 100}%`;
  const totalBars = session.symbols.reduce(
    (total, stock) => total + stock.barsProcessed,
    0,
  );
  const expectedBars = session.symbols.reduce(
    (total, stock) => total + stock.barsExpected,
    0,
  );
  const signals = session.symbols.filter(
    (stock) => stock.signal === "INVEST",
  ).length;
  const warnings = session.symbols.filter(
    (stock) => stock.signal === "WARNING",
  ).length;
  const completeSymbols = session.symbols.length - warnings;

  const comparisonSessions =
    dataState === "current"
      ? [...sessions].sort((first, second) => {
          const firstTime = new Date(first.updatedAt).getTime();
          const secondTime = new Date(second.updatedAt).getTime();

          if (
            Number.isFinite(firstTime) &&
            Number.isFinite(secondTime) &&
            firstTime !== secondTime
          ) {
            return secondTime - firstTime;
          }

          return second.tradingDate.localeCompare(
            first.tradingDate,
          );
        })
      : [];

  const comparisonCurrent = comparisonSessions[0] ?? null;
  const comparisonPrevious = comparisonSessions[1] ?? null;

  const comparisonCurrentSymbols = new Map(
    comparisonCurrent?.symbols.map((stock) => [
      stock.symbol,
      stock,
    ]) ?? [],
  );

  const comparisonPreviousSymbols = new Map(
    comparisonPrevious?.symbols.map((stock) => [
      stock.symbol,
      stock,
    ]) ?? [],
  );

  const comparisonSymbolNames = Array.from(
    new Set([
      ...comparisonCurrentSymbols.keys(),
      ...comparisonPreviousSymbols.keys(),
    ]),
  ).sort();

  const comparisonRows = comparisonSymbolNames.map(
    (symbol) => {
      const currentStock =
        comparisonCurrentSymbols.get(symbol) ?? null;
      const previousStock =
        comparisonPreviousSymbols.get(symbol) ?? null;

      const change =
        !previousStock && currentStock
          ? "ADDED"
          : previousStock && !currentStock
            ? "REMOVED"
            : previousStock?.signal !== currentStock?.signal
              ? "CHANGED"
              : "UNCHANGED";

      return {
        symbol,
        currentStock,
        previousStock,
        change,
      };
    },
  );

  const comparisonAdded = comparisonRows.filter(
    (row) => row.change === "ADDED",
  );

  const comparisonRemoved = comparisonRows.filter(
    (row) => row.change === "REMOVED",
  );

  const comparisonChanged = comparisonRows.filter(
    (row) => row.change === "CHANGED",
  );

  const comparisonCurrentSignals =
    comparisonCurrent?.symbols.filter(
      (stock) => stock.signal === "INVEST",
    ).length ?? 0;

  const comparisonPreviousSignals =
    comparisonPrevious?.symbols.filter(
      (stock) => stock.signal === "INVEST",
    ).length ?? 0;

  const comparisonCurrentWarnings =
    comparisonCurrent?.symbols.filter(
      (stock) => stock.signal === "WARNING",
    ).length ?? 0;

  const comparisonPreviousWarnings =
    comparisonPrevious?.symbols.filter(
      (stock) => stock.signal === "WARNING",
    ).length ?? 0;

  const comparisonCurrentBars =
    comparisonCurrent?.symbols.reduce(
      (total, stock) => total + stock.barsProcessed,
      0,
    ) ?? 0;

  const comparisonCurrentExpectedBars =
    comparisonCurrent?.symbols.reduce(
      (total, stock) => total + stock.barsExpected,
      0,
    ) ?? 0;

  const comparisonPreviousBars =
    comparisonPrevious?.symbols.reduce(
      (total, stock) => total + stock.barsProcessed,
      0,
    ) ?? 0;

  const comparisonPreviousExpectedBars =
    comparisonPrevious?.symbols.reduce(
      (total, stock) => total + stock.barsExpected,
      0,
    ) ?? 0;

  const comparisonCurrentCompleteness =
    comparisonCurrentExpectedBars > 0
      ? (comparisonCurrentBars /
          comparisonCurrentExpectedBars) *
        100
      : 0;

  const comparisonPreviousCompleteness =
    comparisonPreviousExpectedBars > 0
      ? (comparisonPreviousBars /
          comparisonPreviousExpectedBars) *
        100
      : 0;

  const attentionSymbols = session.symbols.filter(
    (stock) =>
      stock.signal === "WARNING" ||
      stock.barsProcessed < stock.barsExpected,
  );

  const investSymbols = session.symbols.filter(
    (stock) => stock.signal === "INVEST",
  );

  const noInvestSymbols = session.symbols.filter(
    (stock) => stock.signal === "NO INVEST",
  );

  const sessionComplete =
    warnings === 0 &&
    totalBars === expectedBars &&
    session.symbols.length > 0;

  const reliabilitySelected =
    session.symbolReliability?.filter(
      (record) => record.status === "SELECTED",
    ).length ?? 0;

  const reliabilityExcluded =
    session.symbolReliability?.filter(
      (record) =>
        record.status === "EXCLUDED_LOW_RELIABILITY",
    ).length ?? 0;

  const reliabilityLimited =
    session.symbolReliability?.filter(
      (record) =>
        record.status ===
        "NOT_SELECTED_RANKING_LIMIT",
    ).length ?? 0;

  const displayDate = formatTradingDate(session.tradingDate);
  const updatedTime = formatUpdatedTime(session.updatedAt);
  const freshness = getSessionFreshness({
    session,
    dataState,
    now: freshnessNow,
  });

  const readinessChecks = [
    {
      label: "Current session verified",
      passed: freshness.status === "current",
      detail:
        freshness.status === "current"
          ? "The session belongs to today's New York market date."
          : freshness.message,
    },
    {
      label: "Opening data complete",
      passed: totalBars === expectedBars && warnings === 0,
      detail:
        totalBars === expectedBars && warnings === 0
          ? `${totalBars}/${expectedBars} required bars were available.`
          : `${totalBars}/${expectedBars} bars were available with ${warnings} warning${
              warnings === 1 ? "" : "s"
            }.`,
    },
    {
      label: "Final Fibonacci evaluation received",
      passed: freshness.finalEvaluationReceived,
      detail: freshness.finalEvaluationReceived
        ? "The final Fibonacci session payload was received."
        : `Current session source: ${session.source}.`,
    },
    {
      label: "Strategy decisions available",
      passed: session.symbols.length > 0,
      detail:
        session.symbols.length > 0
          ? `${session.symbols.length} symbol decision${
              session.symbols.length === 1 ? "" : "s"
            } are available.`
          : "No symbol decisions are available.",
    },
    {
      label: "Broker submission disabled",
      passed: true,
      detail:
        "Submitted means sent from this system to a broker for execution. This dashboard cannot submit orders.",
    },
    {
      label: "Orders sent to broker",
      passed: true,
      detail: "0 orders were sent to a broker for execution.",
    },
  ];

  const readinessStatus =
    freshness.status === "checking"
      ? "CHECKING SESSION"
      : freshness.status === "stale"
        ? "BLOCKED — SESSION STALE"
        : totalBars !== expectedBars || warnings > 0
          ? "BLOCKED — DATA INCOMPLETE"
          : !freshness.finalEvaluationReceived
            ? "BLOCKED — STRATEGY NOT FINAL"
            : session.symbols.length === 0
              ? "BLOCKED — NO DECISIONS"
              : "READY FOR PAPER REVIEW";

  const readinessReady =
    readinessStatus === "READY FOR PAPER REVIEW";

  const tableTitle =
    filter === "signals"
      ? "Today’s orders"
      : filter === "complete"
        ? "Complete symbols"
        : filter === "warnings"
          ? "Data warning details"
          : "Tracked symbols";

  return (
    <main className="dashboard-shell">
      <aside className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand-row">
            <Mark />
            <button
              aria-label={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
              aria-expanded={sidebarOpen}
              className="sidebar-toggle"
              data-tooltip={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
              title={sidebarOpen ? "Collapse navigation" : "Expand navigation"}
              onClick={() => setSidebarOpen((current) => !current)}
              type="button"
            >
              <span aria-hidden="true">{sidebarOpen ? "‹" : "›"}</span>
            </button>
          </div>
          <section className="session-block">
            <p className="eyebrow">Session</p>
            <div className="session-date">
              <Icon name="calendar" />
              <span>{displayDate}</span>
            </div>
            <div className="safe-pill">READ-ONLY · PAPER MODE</div>
          </section>

          <nav aria-label="Dashboard sections" className="nav-list">
            <button
              aria-current={activeSection === "today" ? "page" : undefined}
              className={`nav-item ${
                activeSection === "today" ? "active" : ""
              }`}
              data-tooltip="Today"
              title="Today"
              onClick={() => navigateTo("today")}
              type="button"
            >
              <Icon name="calendar" />
              <span>Today</span>
            </button>

            <button
              aria-current={
                activeSection === "operations" ? "page" : undefined
              }
              className={`nav-item ${
                activeSection === "operations" ? "active" : ""
              }`}
              data-tooltip="Operations"
              title="Operations"
              onClick={() => navigateTo("operations")}
              type="button"
            >
              <Icon name="audit" />
              <span>Operations</span>
            </button>

            <button
              aria-current={activeSection === "overview" ? "page" : undefined}
              className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
              data-tooltip="Overview"
              title="Overview"
              onClick={() => navigateTo("overview")}
              type="button"
            >
              <Icon name="overview" />
              <span>Overview</span>
            </button>
            <button
              aria-current={activeSection === "symbols" ? "page" : undefined}
              className={`nav-item ${activeSection === "symbols" ? "active" : ""}`}
              data-tooltip="Invest signals"
              title="Invest signals"
              onClick={() => showSymbolView("signals")}
              type="button"
            >
              <Icon name="signals" />
              <span>Signals</span>
            </button>
            <button
              aria-current={
                activeSection === "diagnosis"
                  ? "page"
                  : undefined
              }
              className={`nav-item ${
                activeSection === "diagnosis"
                  ? "active"
                  : ""
              }`}
              data-tooltip="Stock diagnosis"
              title="Stock diagnosis"
              onClick={() => {
                if (!selectedSymbol && session.symbols.length > 0) {
                  setSelectedSymbol(session.symbols[0].symbol);
                }
                navigateTo("diagnosis");
              }}
              type="button"
            >
              <Icon name="audit" />
              <span>Stock Diagnosis</span>
            </button>

            <button
              aria-current={
                activeSection === "glossary" ? "page" : undefined
              }
              className={`nav-item ${
                activeSection === "glossary" ? "active" : ""
              }`}
              data-tooltip="Strategy glossary"
              title="Strategy glossary"
              onClick={() => navigateTo("glossary")}
              type="button"
            >
              <Icon name="glossary" />
              <span>Strategy Glossary</span>
            </button>

            <button
              aria-current={
                activeSection === "comparison"
                  ? "page"
                  : undefined
              }
              className={`nav-item ${
                activeSection === "comparison"
                  ? "active"
                  : ""
              }`}
              data-tooltip="Session comparison"
              title="Session comparison"
              onClick={() => navigateTo("comparison")}
              type="button"
            >
              <Icon name="comparison" />
              <span>Session Comparison</span>
            </button>

            <button
              aria-current={activeSection === "history" ? "page" : undefined}
              className={`nav-item ${activeSection === "history" ? "active" : ""}`}
              data-tooltip="Session history"
              title="Session history"
              onClick={() => navigateTo("history")}
              type="button"
            >
              <Icon name="history" />
              <span>Session history</span>
            </button>
            <button
              aria-current={
                activeSection === "performance" ? "page" : undefined
              }
              className={`nav-item ${activeSection === "performance" ? "active" : ""}`}
              data-tooltip="Performance"
              title="Performance"
              onClick={() => navigateTo("performance")}
              type="button"
            >
              <Icon name="performance" />
              <span>Performance</span>
            </button>
            <button
              aria-current={activeSection === "replay" ? "page" : undefined}
              className={`nav-item ${activeSection === "replay" ? "active" : ""}`}
              data-tooltip="Replay"
              title="Replay"
              onClick={() => navigateTo("replay")}
              type="button"
            >
              <Icon name="replay" />
              <span>Replay</span>
            </button>
            <button
              aria-current={activeSection === "audit" ? "page" : undefined}
              className={`nav-item ${activeSection === "audit" ? "active" : ""}`}
              data-tooltip="Audit log"
              title="Audit log"
              onClick={() => navigateTo("audit")}
              type="button"
            >
              <Icon name="audit" />
              <span>Audit log</span>
            </button>
          </nav>
        </div>

        <div className="market-state">
          <span className="market-orbit">
            <i />
          </span>
          <div>
            <strong>Market closed</strong>
            <span>Snapshot verified</span>
          </div>
        </div>
      </aside>

      <section
        className={`workspace section-${activeSection} freshness-${freshness.status}`}
        id="overview"
      >
        <header className="topbar">
          <div>
            <p className="mobile-kicker">TRADING OPERATIONS</p>
            <h1>Cameron Trading Desk</h1>
            <p className="mode-label">READ-ONLY · PAPER MODE</p>
          </div>
          <div className="topbar-actions">
            <span className="market-closed">◷ Market closed</span>
            <span className="top-date">
              <Icon name="calendar" size={18} />
              {displayDate}
            </span>
            <button className="replay-button" onClick={startReplay} type="button">
              <span aria-hidden="true">▶</span>
              Run replay
            </button>
          </div>
        </header>

        <section
          className={`freshness-banner freshness-banner-${freshness.status}`}
          aria-live="polite"
          aria-label="Session freshness status"
        >
          <span className="freshness-banner-icon" aria-hidden="true">
            {freshness.status === "current"
              ? "✓"
              : freshness.status === "stale"
                ? "!"
                : "…"}
          </span>

          <div className="freshness-banner-copy">
            <small>SESSION FRESHNESS</small>
            <strong>{freshness.title}</strong>
            <p>{freshness.message}</p>
          </div>

          <div className="freshness-banner-facts">
            <span>
              <small>Trading date</small>
              <strong>{session.tradingDate}</strong>
            </span>

            <span>
              <small>Source</small>
              <strong>
                {dataState === "current"
                  ? "API SESSION"
                  : dataState === "fallback"
                    ? "FALLBACK"
                    : "CHECKING"}
              </strong>
            </span>

            <span>
              <small>Latest update</small>
              <strong>{freshness.ageLabel}</strong>
            </span>

            <span>
              <small>Final evaluation</small>
              <strong>
                {freshness.finalEvaluationReceived
                  ? "RECEIVED"
                  : "NOT CONFIRMED"}
              </strong>
            </span>
          </div>
        </section>

        <div className="content">
          <section className="today-page" aria-label="Today operations">
            <div className="today-heading">
              <div>
                <span className="panel-kicker">TODAY&apos;S OPERATIONS</span>
                <h2>{displayDate}</h2>
                <p>
                  Current paper-trading session health, strategy decisions,
                  publishing state, and safety controls.
                </p>
              </div>

              <span
                className={`today-session-status ${
                  sessionComplete
                    ? "today-session-complete"
                    : "today-session-incomplete"
                }`}
              >
                {sessionComplete ? "COMPLETE" : "INCOMPLETE"}
              </span>
            </div>

            <section className="today-operations-grid">
              <article className="today-operation-card">
                <small>Session</small>
                <strong>
                  {sessionComplete ? "COMPLETE" : "INCOMPLETE"}
                </strong>
                <span>
                  {sessionComplete
                    ? "All opening data was available."
                    : "One or more symbols require attention."}
                </span>
              </article>

              <article className="today-operation-card">
                <small>Market-data feed</small>
                <strong>{session.dataFeed}</strong>
                <span>Data source used for this session.</span>
              </article>

              <article className="today-operation-card">
                <small>Opening data</small>
                <strong>
                  {totalBars}/{expectedBars} bars
                </strong>
                <span>
                  {completeSymbols}/{session.symbols.length} complete symbols
                </span>
              </article>

              <article className="today-operation-card">
                <small>Active strategy</small>
                <strong>FIBONACCI 61.8%</strong>
                <span>Forward paper evaluation only.</span>
              </article>

              <article className="today-operation-card">
                <small>INVEST signals</small>
                <strong>{signals}</strong>
                <span>Qualifying strategy decisions.</span>
              </article>

              <article className="today-operation-card">
                <small>Data warnings</small>
                <strong>{warnings}</strong>
                <span>Incomplete or unreliable symbols.</span>
              </article>

              <article className="today-operation-card">
                <small>Dashboard session</small>
                <strong>
                  {dataState === "current"
                    ? "PUBLISHED"
                    : dataState === "loading"
                      ? "CHECKING"
                      : "FALLBACK"}
                </strong>
                <span>
                  {dataState === "current"
                    ? "Latest stored session loaded."
                    : dataState === "loading"
                      ? "Checking the session API."
                      : "Showing the verified local snapshot."}
                </span>
              </article>

              <article className="today-operation-card">
                <small>Webull</small>
                <strong>PREVIEW ONLY</strong>
                <span>No broker submission is enabled.</span>
              </article>

              <article className="today-operation-card">
                <small>Sent to broker</small>
                <strong>0</strong>
                <span>
                  Submitted means sent from this system to a broker
                  for execution. None were sent.
                </span>
              </article>

              <article className="today-operation-card">
                <small>Last updated</small>
                <strong>{updatedTime}</strong>
                <span>Latest dashboard session update.</span>
              </article>
            </section>

            <section
              className="today-timeline-panel"
              aria-label="Session workflow timeline"
            >
              <div className="today-timeline-heading">
                <div>
                  <span className="panel-kicker">SESSION WORKFLOW</span>
                  <h3>Run progress</h3>
                  <p>
                    Verified stages from market-data collection through
                    dashboard publishing. Missing stage times are not estimated.
                  </p>
                </div>

                <span className="today-timeline-updated">
                  Updated {updatedTime}
                </span>
              </div>

              <div className="today-timeline">
                <article className="today-timeline-step timeline-complete">
                  <span className="today-timeline-marker" aria-hidden="true">
                    ✓
                  </span>

                  <div>
                    <small>STAGE 1</small>
                    <strong>Session received</strong>
                    <p>
                      The dashboard loaded a stored or verified session payload.
                    </p>
                  </div>

                  <b>COMPLETE</b>
                </article>

                <article
                  className={`today-timeline-step ${
                    totalBars === expectedBars
                      ? "timeline-complete"
                      : "timeline-warning"
                  }`}
                >
                  <span className="today-timeline-marker" aria-hidden="true">
                    {totalBars === expectedBars ? "✓" : "!"}
                  </span>

                  <div>
                    <small>STAGE 2</small>
                    <strong>Opening bars loaded</strong>
                    <p>
                      {totalBars}/{expectedBars} required opening bars were
                      available across {session.symbols.length} symbols.
                    </p>
                  </div>

                  <b>
                    {totalBars === expectedBars ? "COMPLETE" : "WARNING"}
                  </b>
                </article>

                <article
                  className={`today-timeline-step ${
                    session.symbols.length > 0
                      ? "timeline-complete"
                      : "timeline-pending"
                  }`}
                >
                  <span className="today-timeline-marker" aria-hidden="true">
                    {session.symbols.length > 0 ? "✓" : "…"}
                  </span>

                  <div>
                    <small>STAGE 3</small>
                    <strong>Strategy evaluated</strong>
                    <p>
                      {signals} INVEST, {noInvestSymbols.length} NO INVEST,
                      and {warnings} warning decisions were recorded.
                    </p>
                  </div>

                  <b>
                    {session.symbols.length > 0 ? "COMPLETE" : "PENDING"}
                  </b>
                </article>

                <article
                  className={`today-timeline-step ${
                    dataState === "current"
                      ? "timeline-complete"
                      : dataState === "loading"
                        ? "timeline-pending"
                        : "timeline-warning"
                  }`}
                >
                  <span className="today-timeline-marker" aria-hidden="true">
                    {dataState === "current"
                      ? "✓"
                      : dataState === "loading"
                        ? "…"
                        : "!"}
                  </span>

                  <div>
                    <small>STAGE 4</small>
                    <strong>Dashboard session published</strong>
                    <p>
                      {dataState === "current"
                        ? "The latest stored session was loaded from the dashboard API."
                        : dataState === "loading"
                          ? "The dashboard is still checking for the latest session."
                          : "The dashboard is displaying its verified fallback snapshot."}
                    </p>
                  </div>

                  <b>
                    {dataState === "current"
                      ? "PUBLISHED"
                      : dataState === "loading"
                        ? "CHECKING"
                        : "FALLBACK"}
                  </b>
                </article>

                <article className="today-timeline-step timeline-locked">
                  <span className="today-timeline-marker" aria-hidden="true">
                    ▣
                  </span>

                  <div>
                    <small>STAGE 5</small>
                    <strong>Broker submission</strong>
                    <p>
                      Webull remains preview-only. Submitted means sent
                      from this system to a broker for execution. No order was
                      sent, cancelled, or replaced.
                    </p>
                  </div>

                  <b>DISABLED</b>
                </article>
              </div>
            </section>

            <section
              className={`readiness-gate ${
                readinessReady
                  ? "readiness-ready"
                  : readinessStatus === "CHECKING SESSION"
                    ? "readiness-checking"
                    : "readiness-blocked"
              }`}
              aria-label="Trade readiness"
            >
              <div className="readiness-heading">
                <div>
                  <span className="panel-kicker">
                    PAPER-SESSION READINESS
                  </span>
                  <h3>{readinessStatus}</h3>
                  <p>
                    This gate confirms whether the current dashboard session
                    is reliable enough for paper review. It does not authorize
                    live trading or broker execution.
                  </p>
                </div>

                <span
                  className="readiness-status-icon"
                  aria-hidden="true"
                >
                  {readinessReady
                    ? "✓"
                    : readinessStatus === "CHECKING SESSION"
                      ? "…"
                      : "!"}
                </span>
              </div>

              <div className="readiness-checklist">
                {readinessChecks.map((check) => (
                  <article
                    className={`readiness-check ${
                      check.passed
                        ? "readiness-check-pass"
                        : "readiness-check-fail"
                    }`}
                    key={check.label}
                  >
                    <span aria-hidden="true">
                      {check.passed ? "✓" : "×"}
                    </span>

                    <div>
                      <strong>{check.label}</strong>
                      <p>{check.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="today-decision-columns">
              <article className="today-decision-group today-attention-group">
                <header>
                  <div>
                    <span className="today-group-icon" aria-hidden="true">
                      !
                    </span>
                    <div>
                      <small>REQUIRES ATTENTION</small>
                      <h3>Data warnings</h3>
                    </div>
                  </div>
                  <strong>{attentionSymbols.length}</strong>
                </header>

                {attentionSymbols.length ? (
                  <div className="today-symbol-list">
                    {attentionSymbols.map((stock) => (
                      <button
                        className="today-symbol-row"
                        key={stock.symbol}
                        onClick={() =>
                          openStockDiagnosis(stock.symbol)
                        }
                        type="button"
                      >
                        <span>
                          <strong>{stock.symbol}</strong>
                          <small>
                            {stock.barsProcessed}/
                            {stock.barsExpected} opening bars
                          </small>
                        </span>
                        <b>Review diagnosis →</b>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="today-empty-state">
                    <strong>No data warnings</strong>
                    <p>Every tracked symbol has complete opening data.</p>
                  </div>
                )}
              </article>

              <article className="today-decision-group today-invest-group">
                <header>
                  <div>
                    <span className="today-group-icon" aria-hidden="true">
                      ✓
                    </span>
                    <div>
                      <small>QUALIFYING DECISIONS</small>
                      <h3>INVEST signals</h3>
                    </div>
                  </div>
                  <strong>{investSymbols.length}</strong>
                </header>

                {investSymbols.length ? (
                  <div className="today-symbol-list">
                    {investSymbols.map((stock) => (
                      <button
                        className="today-symbol-row"
                        key={stock.symbol}
                        onClick={() =>
                          openStockDiagnosis(stock.symbol)
                        }
                        type="button"
                      >
                        <span>
                          <strong>{stock.symbol}</strong>
                          <small>
                            Qualified under the active strategy
                          </small>
                        </span>
                        <b>Open diagnosis →</b>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="today-empty-state">
                    <strong>No qualifying signals today</strong>
                    <p>
                      No stock satisfied every required strategy rule.
                    </p>
                  </div>
                )}
              </article>

              <article className="today-decision-group today-rejected-group">
                <header>
                  <div>
                    <span className="today-group-icon" aria-hidden="true">
                      ×
                    </span>
                    <div>
                      <small>STRATEGY REJECTIONS</small>
                      <h3>NO INVEST decisions</h3>
                    </div>
                  </div>
                  <strong>{noInvestSymbols.length}</strong>
                </header>

                {noInvestSymbols.length ? (
                  <div className="today-symbol-list">
                    {noInvestSymbols.map((stock) => (
                      <button
                        className="today-symbol-row"
                        key={stock.symbol}
                        onClick={() =>
                          openStockDiagnosis(stock.symbol)
                        }
                        type="button"
                      >
                        <span>
                          <strong>{stock.symbol}</strong>
                          <small>
                            {
                              rejectionDefinition(
                                stock.strategy?.rejectionReason,
                              ).title
                            }
                          </small>
                        </span>
                        <b>Open diagnosis →</b>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="today-empty-state">
                    <strong>No rejected symbols</strong>
                    <p>
                      No complete symbol was rejected by the strategy.
                    </p>
                  </div>
                )}
              </article>
            </section>

            <section className="today-safety-note">
              <span aria-hidden="true">▣</span>
              <div>
                <strong>Paper-trading safety remains active</strong>
                <p>
                  Dashboard information is read-only. Submitting an order
                  means sending it from this system to a broker for execution.
                  This interface cannot submit, cancel, or replace orders.
                </p>
              </div>
            </section>
          </section>

          <section
            className="glossary-page"
            aria-label="Fibonacci strategy glossary"
          >
            <div className="glossary-heading">
              <div>
                <span className="panel-kicker">STRATEGY REFERENCE</span>
                <h2>Fibonacci rejection glossary</h2>
                <p>
                  Plain-language definitions for the strategy codes shown
                  throughout Today, Signals, and Stock Diagnosis.
                </p>
              </div>

              <span className="glossary-strategy-badge">
                FIBONACCI 61.8%
              </span>
            </div>

            <section className="glossary-introduction">
              <span aria-hidden="true">i</span>
              <div>
                <strong>How to use this page</strong>
                <p>
                  A rejection code explains why a symbol did not qualify.
                  It does not indicate that an order was submitted. All
                  dashboard results remain paper-only and read-only.
                </p>
              </div>
            </section>

            <div className="glossary-grid">
              {[
                "NO_QUALIFYING_UPWARD_IMPULSE",
                "RETRACEMENT_ZONE_NOT_TOUCHED",
                "REWARD_RISK_BELOW_MINIMUM",
                "NO_BULLISH_CONFIRMATION",
                "PULLBACK_VOLUME_TOO_HIGH",
                "OPENING_DATA_INCOMPLETE",
                "ATR_UNAVAILABLE",
                "INVALID_TRADE_LEVELS",
                "PRICE_ABOVE_ENTRY_LIMIT",
                "NO_ENTRY_TRIGGER",
              ].map((code) => {
                const definition = rejectionDefinition(code);

                return (
                  <article className="glossary-card" key={code}>
                    <div className="glossary-card-header">
                      <span className="glossary-code">{code}</span>
                      <span
                        className="glossary-rejected-badge"
                        aria-label="No invest condition"
                      >
                        NO INVEST
                      </span>
                    </div>

                    <h3>{definition.title}</h3>

                    <div className="glossary-section">
                      <small>WHAT IT MEANS</small>
                      <p>{definition.explanation}</p>
                    </div>

                    <div className="glossary-section glossary-pass-condition">
                      <small>WHAT WOULD NEED TO CHANGE</small>
                      <p>{definition.nextStep}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <section className="glossary-footer-note">
              <span aria-hidden="true">▣</span>
              <div>
                <strong>Strategy definitions only</strong>
                <p>
                  These explanations describe the active strategy logic.
                  They are not investment advice and do not represent
                  submitted broker orders.
                </p>
              </div>
            </section>
          </section>

          <section
            className="operations-page"
            aria-label="Trading system operations"
          >
            <div className="operations-heading">
              <div>
                <span className="panel-kicker">SYSTEM OPERATIONS</span>
                <h2>Run health and workflow</h2>
                <p>
                  Technical status for data collection, strategy evaluation,
                  dashboard publishing, and broker safety controls.
                </p>
              </div>

              <span
                className={`operations-status ${
                  sessionComplete
                    ? "operations-status-complete"
                    : "operations-status-warning"
                }`}
              >
                {sessionComplete ? "HEALTHY" : "WARNING"}
              </span>
            </div>

            <section className="operations-status-grid">
              <article className="operations-status-card">
                <small>Run mode</small>
                <strong>
                  {session.productionHealth?.runMode ?? "PAPER"}
                </strong>
                <span>Current execution mode.</span>
              </article>

              <article className="operations-status-card">
                <small>Workflow</small>
                <strong>
                  {session.productionHealth?.workflowStatus ??
                    (sessionComplete ? "COMPLETE" : "INCOMPLETE")}
                </strong>
                <span>Overall processing state.</span>
              </article>

              <article className="operations-status-card">
                <small>Market-data feed</small>
                <strong>{session.dataFeed}</strong>
                <span>Feed used for this session.</span>
              </article>

              <article className="operations-status-card">
                <small>Opening data</small>
                <strong>
                  {totalBars}/{expectedBars}
                </strong>
                <span>
                  {completeSymbols}/{session.symbols.length} complete symbols
                </span>
              </article>

              <article className="operations-status-card">
                <small>Dashboard publish</small>
                <strong>
                  {dataState === "current"
                    ? "PUBLISHED"
                    : dataState === "loading"
                      ? "CHECKING"
                      : "FALLBACK"}
                </strong>
                <span>Stored-session availability.</span>
              </article>

              <article className="operations-status-card">
                <small>Active strategy</small>
                <strong>FIBONACCI 61.8%</strong>
                <span>Forward paper strategy.</span>
              </article>

              <article className="operations-status-card">
                <small>Webull</small>
                <strong>PREVIEW ONLY</strong>
                <span>Broker submission remains disabled.</span>
              </article>

              <article className="operations-status-card">
                <small>Sent to broker</small>
                <strong>0</strong>
                <span>
                  Submitted means sent from this system to a broker
                  for execution. None were sent.
                </span>
              </article>

              <article className="operations-status-card">
                <small>Last updated</small>
                <strong>{updatedTime}</strong>
                <span>Latest dashboard session update.</span>
              </article>
            </section>

            <section
              className="operations-timeline-panel"
              aria-label="Session workflow timeline"
            >
              <div className="operations-timeline-heading">
                <div>
                  <span className="panel-kicker">SESSION WORKFLOW</span>
                  <h3>Run progress</h3>
                  <p>
                    Verified stages from session loading through dashboard
                    publishing. Missing timestamps are not estimated.
                  </p>
                </div>

                <span>Updated {updatedTime}</span>
              </div>

              <div className="operations-timeline">
                <article className="operations-step operations-step-complete">
                  <span className="operations-step-icon" aria-hidden="true">
                    ✓
                  </span>

                  <div>
                    <small>STAGE 1</small>
                    <strong>Session received</strong>
                    <p>
                      A stored or verified dashboard session was loaded.
                    </p>
                  </div>

                  <b>COMPLETE</b>
                </article>

                <article
                  className={`operations-step ${
                    totalBars === expectedBars
                      ? "operations-step-complete"
                      : "operations-step-warning"
                  }`}
                >
                  <span className="operations-step-icon" aria-hidden="true">
                    {totalBars === expectedBars ? "✓" : "!"}
                  </span>

                  <div>
                    <small>STAGE 2</small>
                    <strong>Opening data collected</strong>
                    <p>
                      {totalBars} of {expectedBars} required opening bars were
                      available.
                    </p>
                  </div>

                  <b>
                    {totalBars === expectedBars ? "COMPLETE" : "WARNING"}
                  </b>
                </article>

                <article className="operations-step operations-step-complete">
                  <span className="operations-step-icon" aria-hidden="true">
                    ✓
                  </span>

                  <div>
                    <small>STAGE 3</small>
                    <strong>Strategy evaluated</strong>
                    <p>
                      {signals} INVEST, {noInvestSymbols.length} NO INVEST,
                      and {warnings} warning decisions were recorded.
                    </p>
                  </div>

                  <b>COMPLETE</b>
                </article>

                <article
                  className={`operations-step ${
                    dataState === "current"
                      ? "operations-step-complete"
                      : dataState === "loading"
                        ? "operations-step-pending"
                        : "operations-step-warning"
                  }`}
                >
                  <span className="operations-step-icon" aria-hidden="true">
                    {dataState === "current"
                      ? "✓"
                      : dataState === "loading"
                        ? "…"
                        : "!"}
                  </span>

                  <div>
                    <small>STAGE 4</small>
                    <strong>Dashboard session published</strong>
                    <p>
                      {dataState === "current"
                        ? "The latest stored session was loaded from the API."
                        : dataState === "loading"
                          ? "The dashboard is checking for the latest session."
                          : "The verified local fallback snapshot is being shown."}
                    </p>
                  </div>

                  <b>
                    {dataState === "current"
                      ? "PUBLISHED"
                      : dataState === "loading"
                        ? "CHECKING"
                        : "FALLBACK"}
                  </b>
                </article>

                <article className="operations-step operations-step-locked">
                  <span className="operations-step-icon" aria-hidden="true">
                    ▣
                  </span>

                  <div>
                    <small>STAGE 5</small>
                    <strong>Broker submission</strong>
                    <p>
                      Webull is preview-only. Submitted means sent from
                      this system to a broker for execution. No order was sent,
                      cancelled, or replaced.
                    </p>
                  </div>

                  <b>DISABLED</b>
                </article>
              </div>
            </section>

            <section className="operations-safety">
              <span aria-hidden="true">▣</span>
              <div>
                <strong>Execution safety confirmed</strong>
                <p>
                  This dashboard is read-only. Submitting an order means
                  sending it from this system to a broker for execution. This
                  dashboard cannot submit, cancel, or replace broker orders.
                </p>
              </div>
            </section>
          </section>

          <section className="overview-intro">
            <div>
              <span className="panel-kicker">SESSION ANALYSIS</span>
              <h2>Strategy overview</h2>
              <p>
                Detailed Fibonacci strategy evaluation, symbol decisions,
                order plans, reliability checks, and session analysis.
              </p>
            </div>

            <div className="overview-intro-facts">
              <span>
                <small>Symbols analyzed</small>
                <strong>{session.symbols.length}</strong>
              </span>
              <span>
                <small>INVEST decisions</small>
                <strong>{signals}</strong>
              </span>
              <span>
                <small>Strategy</small>
                <strong>FIBONACCI 61.8%</strong>
              </span>
            </div>
          </section>

          <section className="status-strip" aria-label="Replay summary">
            <Metric
              icon="complete"
              tone="complete"
              label="Complete symbols"
              value={`${completeSymbols}/${session.symbols.length}`}
              active={filter === "complete"}
              onClick={() => showSymbolView("complete")}
            />
            <Metric
              icon="bars"
              tone="bars"
              label="Bars loaded"
              value={`${totalBars}/${expectedBars}`}
              active={filter === "all"}
              onClick={() => showSymbolView("all")}
            />
            <Metric
              icon="invest"
              tone="invest"
              label="INVEST signals"
              value={String(signals)}
              active={filter === "signals"}
              onClick={() => showSymbolView("signals")}
            />
            <Metric
              icon="warning"
              tone="warning"
              label="Data warning"
              value={String(warnings)}
              active={filter === "warnings"}
              onClick={() => showSymbolView("warnings")}
            />
          </section>

          {session.productionHealth ? (
            <section
              className={`production-health ${
                session.productionHealth.dataStatus.toLowerCase()
              }`}
              aria-label="Production run health"
            >
              <div className="production-health-title">
                <span className="health-indicator" />
                <div>
                  <small>PRODUCTION HEALTH</small>
                  <strong>
                    {session.productionHealth.dataStatus ===
                    "HEALTHY"
                      ? "Run completed successfully"
                      : "Run completed with a data warning"}
                  </strong>
                </div>
              </div>

              <div className="production-health-facts">
                <span>
                  <small>Run type</small>
                  <b>{session.productionHealth.runMode}</b>
                </span>
                <span>
                  <small>Workflow</small>
                  <b>
                    {session.productionHealth.workflowStatus}
                  </b>
                </span>
                <span>
                  <small>Session</small>
                  <b>RECEIVED</b>
                </span>
                <span>
                  <small>Feed</small>
                  <b>{session.dataFeed}</b>
                </span>
                <span>
                  <small>Updated</small>
                  <b>{updatedTime}</b>
                </span>
              </div>
            </section>
          ) : null}

          <section
            className="panel fibonacci-paper-panel"
            aria-label="Fibonacci forward paper status"
          >
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  FORWARD PAPER OBSERVATIONS
                </span>
                <h2>Fibonacci retracement paper strategy</h2>
              </div>
              <span className="fibonacci-safety">
                PAPER ONLY · NOT SUBMITTED
              </span>
            </div>

            {fibonacciPaper ? (
              <>
                <div className="fibonacci-summary">
                  <div>
                    <small>Today’s check</small>
                    <strong
                      className={
                        fibonacciPaper.todayCompleted
                          ? "positive"
                          : "negative"
                      }
                    >
                      {fibonacciPaper.todayCompleted
                        ? "Completed"
                        : "Not completed"}
                    </strong>
                  </div>
                  <div>
                    <small>Forward setups</small>
                    <strong>
                      {
                        fibonacciPaper.forward
                          .qualifyingSetups
                      }
                    </strong>
                  </div>
                  <div>
                    <small>Closed trades</small>
                    <strong>
                      {fibonacciPaper.forward.closedTrades}
                    </strong>
                  </div>
                  <div>
                    <small>Wins / losses</small>
                    <strong>
                      {fibonacciPaper.forward.wins} /{" "}
                      {fibonacciPaper.forward.losses}
                    </strong>
                  </div>
                  <div>
                    <small>Profit factor</small>
                    <strong>
                      {fibonacciPaper.forward.profitFactor ===
                      null
                        ? "—"
                        : fibonacciPaper.forward.profitFactor.toFixed(
                            3,
                          )}
                    </strong>
                  </div>
                  <div>
                    <small>Average return</small>
                    <strong>
                      {fibonacciPaper.forward
                        .averageReturnPct === null
                        ? "—"
                        : `${
                            fibonacciPaper.forward
                              .averageReturnPct >= 0
                              ? "+"
                              : ""
                          }${fibonacciPaper.forward.averageReturnPct.toFixed(
                            4,
                          )}%`}
                    </strong>
                  </div>
                  <div>
                    <small>Cumulative return</small>
                    <strong>
                      {fibonacciPaper.forward
                        .cumulativeReturnPct >= 0
                        ? "+"
                        : ""}
                      {fibonacciPaper.forward.cumulativeReturnPct.toFixed(
                        4,
                      )}
                      %
                    </strong>
                  </div>
                </div>

                <div className="fibonacci-latest">
                  <div>
                    <small>LATEST FORWARD SETUP</small>
                    {fibonacciPaper.latestForwardSetup ? (
                      <strong>
                        {
                          fibonacciPaper.latestForwardSetup
                            .tradingDate
                        }{" "}
                        ·{" "}
                        {
                          fibonacciPaper.latestForwardSetup
                            .symbol
                        }{" "}
                        ·{" "}
                        {
                          fibonacciPaper.latestForwardSetup
                            .fibonacciLevel
                        }
                      </strong>
                    ) : (
                      <strong>None recorded yet</strong>
                    )}
                  </div>

                  {fibonacciPaper.latestForwardSetup ? (
                    <span
                      className={`outcome ${fibonacciPaper.latestForwardSetup.outcome.toLowerCase()}`}
                    >
                      {
                        fibonacciPaper.latestForwardSetup
                          .outcome
                      }{" "}
                      ·{" "}
                      {fibonacciPaper.latestForwardSetup
                        .netReturnPct >= 0
                        ? "+"
                        : ""}
                      {fibonacciPaper.latestForwardSetup.netReturnPct.toFixed(
                        4,
                      )}
                      %
                    </span>
                  ) : (
                    <span className="fibonacci-no-trade">
                      0 orders submitted
                    </span>
                  )}
                </div>

                <p className="fibonacci-footnote">
                  Historical validation trades are excluded from
                  every metric shown here. Updated{" "}
                  {formatUpdatedTime(
                    fibonacciPaper.updatedAt,
                  )}.
                </p>
              </>
            ) : (
              <div className="fibonacci-empty">
                <strong>
                  {fibonacciState === "loading"
                    ? "Loading paper status"
                    : "No forward paper status published yet"}
                </strong>
                <span>
                  This section never estimates or imports
                  historical validation results.
                </span>
              </div>
            )}
          </section>

          <section className="panel symbol-panel" id="symbols">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">SESSION SNAPSHOT</span>
                <h2>{tableTitle}</h2>
              </div>
              <div className="heading-tools">
                <div className="filter-control" aria-label="Filter tracked symbols">
                  <button
                    aria-pressed={filter === "all"}
                    onClick={() => setFilter("all")}
                    type="button"
                  >
                    All <b>{session.symbols.length}</b>
                  </button>
                  <button
                    aria-pressed={filter === "complete"}
                    onClick={() => setFilter("complete")}
                    type="button"
                  >
                    Complete <b>{completeSymbols}</b>
                  </button>
                  <button
                    aria-pressed={filter === "signals"}
                    onClick={() => setFilter("signals")}
                    type="button"
                  >
                    Invest <b>{signals}</b>
                  </button>
                  <button
                    aria-pressed={filter === "warnings"}
                    onClick={() => setFilter("warnings")}
                    type="button"
                  >
                    Data warnings <b>{warnings}</b>
                  </button>
                </div>
                <div className="data-source">
                  <span />
                  {session.source === "LIVE" ? "Live" : "Historical"}{" "}
                  {session.dataFeed} data
                </div>
              </div>
            </div>

            {filter === "warnings" ? (
              <div
                className="warning-table"
                role="table"
                aria-label="Data warning details"
              >
                <div className="warning-detail-row table-head" role="row">
                  <span role="columnheader">Symbol</span>
                  <span role="columnheader">What went wrong</span>
                  <span role="columnheader">Strategy impact</span>
                </div>
                {filteredSymbols.map((stock) => {
                  const explanation = warningExplanation(stock);

                  return (
                    <div className="warning-detail-row" key={stock.symbol} role="row">
                      <strong role="cell">{stock.symbol}</strong>
                      <span className="warning-reason" role="cell">
                        <b>!</b>
                        {explanation.reason}
                      </span>
                      <span className="warning-impact" role="cell">
                        {explanation.impact}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="symbol-table" role="table" aria-label={tableTitle}>
                <div className="symbol-row table-head" role="row">
                  <span role="columnheader">Symbol</span>
                  <span role="columnheader">Signal</span>
                  <span role="columnheader">Outcome</span>
                  <span role="columnheader">Buy / target sell / stop</span>
                  <span role="columnheader">Data quality</span>
                </div>

                {filteredSymbols.map((stock) => {
                  const rowRiskPerShare = stock.levels
                    ? Math.max(
                        stock.levels.buy -
                          stock.levels.tradingStop,
                        0,
                      )
                    : 0;

                  const rowRiskBudget =
                    accountSize * (riskPercent / 100);

                  const riskShares =
                    rowRiskPerShare > 0
                      ? Math.floor(
                          rowRiskBudget / rowRiskPerShare,
                        )
                      : 0;

                  const valueCapShares = stock.levels
                    ? Math.floor(5000 / stock.levels.buy)
                    : 0;

                  const calculatedShares = Math.min(
                    riskShares,
                    valueCapShares,
                    1000,
                  );

                  const orderShares =
                    stock.webullPreview?.quantity ??
                    calculatedShares;

                  const investDollars =
                    stock.webullPreview
                      ?.estimatedPositionValue ??
                    (stock.levels
                      ? orderShares * stock.levels.buy
                      : undefined);

                  return (
                    <button
                      className={`symbol-row symbol-button ${
                        selectedSymbol === stock.symbol
                          ? "selected"
                          : ""
                      }`}
                      key={stock.symbol}
                      onClick={() =>
                        openStockDiagnosis(stock.symbol)
                      }
                      role="row"
                      type="button"
                    >
                      <strong role="cell">
                        {stock.symbol}
                      </strong>

                      <span role="cell">
                        <span
                          className={`signal ${stock.signal
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {stock.signal}
                        </span>
                      </span>

                      <span role="cell">
                        <OutcomeBadge
                          outcome={stock.outcome}
                        />
                      </span>

                      <span
                        className="order-plan"
                        role="cell"
                      >
                        {stock.levels ? (
                          <>
                            <span className="order-plan-invest">
                              <small>Invest dollars</small>
                              <strong>
                                {investDollars !== undefined
                                  ? money(investDollars)
                                  : "—"}
                              </strong>
                              <i>
                                {orderShares.toLocaleString()} shares
                              </i>
                            </span>

                            <span className="order-plan-buy">
                              <small>Buy at</small>
                              <strong>
                                {money(stock.levels.buy)}
                              </strong>
                              <i>Limit price per share</i>
                            </span>

                            <span className="order-plan-target">
                              <small>Target sell</small>
                              <strong>
                                {money(stock.levels.target)}
                              </strong>
                              <i>Limit sell price per share</i>
                            </span>

                            <span className="order-plan-stop">
                              <small>Stop loss</small>
                              <strong>
                                {money(
                                  stock.levels.tradingStop,
                                )}
                              </strong>
                              <i>Trading stop per share</i>
                            </span>
                          </>
                        ) : (
                          <span className="no-levels">—</span>
                        )}
                      </span>

                      <span className="quality" role="cell">
                        <b>
                          {stock.barsProcessed}/
                          {stock.barsExpected} bars
                        </b>
                        <i>·</i>
                        {stock.detail}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {session.symbolReliability?.length ? (
            <details
              className="panel reliability-panel reliability-disclosure"
            >
              <summary className="reliability-summary">
                <div>
                  <span className="panel-kicker">
                    MARKET DATA QUALITY
                  </span>
                  <strong>Opening-bar reliability</strong>
                </div>

                <span>
                  {reliabilitySelected} selected ·{" "}
                  {reliabilityExcluded} excluded ·{" "}
                  {reliabilityLimited} ranking-limited
                </span>
              </summary>
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    MARKET DATA QUALITY
                  </span>
                  <h2>Opening-bar reliability</h2>
                </div>
                <div className="data-source">
                  <span />
                  Recent {session.dataFeed} opening sessions
                </div>
              </div>

              <div
                className="reliability-table"
                role="table"
                aria-label="Symbol reliability results"
              >
                <div
                  className="reliability-row table-head"
                  role="row"
                >
                  <span role="columnheader">Symbol</span>
                  <span role="columnheader">Completeness</span>
                  <span role="columnheader">History</span>
                  <span role="columnheader">Selection result</span>
                </div>

                {session.symbolReliability.map((record) => (
                  <div
                    className="reliability-row"
                    key={record.symbol}
                    role="row"
                  >
                    <strong role="cell">{record.symbol}</strong>

                    <span role="cell">
                      <b>
                        {(record.completeness * 100).toFixed(1)}%
                      </b>
                    </span>

                    <span role="cell">
                      {record.totalBars}/{record.expectedBars} bars
                      across {record.usableDays} days
                    </span>

                    <span
                      className={`reliability-status ${
                        record.status === "SELECTED"
                          ? "selected"
                          : record.status ===
                              "EXCLUDED_LOW_RELIABILITY"
                            ? "excluded"
                            : "limited"
                      }`}
                      role="cell"
                    >
                      {reliabilityStatusLabel(record.status)}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          ) : null}

          {selectedStock && filter !== "warnings" ? (
            <section className="panel detail-panel" aria-label={`${selectedStock.symbol} details`}>
              <div className="detail-heading">
                <div>
                  <span className="panel-kicker">SYMBOL DETAIL</span>
                  <h2>{selectedStock.symbol} decision review</h2>
                </div>
                <button
                  aria-label="Close symbol details"
                  className="detail-close"
                  onClick={() => setSelectedSymbol(null)}
                  type="button"
                >
                  ×
                </button>
              </div>

              <div className="detail-grid">
                <section className="reason-card">
                  <div className="detail-section-title">
                    <div>
                      <span className={`signal ${selectedStock.signal.toLowerCase().replace(" ", "-")}`}>
                        {selectedStock.signal}
                      </span>
                      <h3>Why this signal?</h3>
                    </div>
                    <span>{selectedStock.rules?.filter((rule) => rule.passed).length ?? 0}/{selectedStock.rules?.length ?? 0} rules passed</span>
                  </div>

                  {selectedStock.rules?.length ? (
                    <div className="rule-list">
                      {selectedStock.rules.map((rule) => (
                        <div className="rule-row" key={rule.label}>
                          <span className={rule.passed ? "rule-pass" : "rule-fail"}>
                            {rule.passed ? "✓" : "×"}
                          </span>
                          <div>
                            <strong>{rule.label}</strong>
                            <small>
                              Actual: {rule.actual} · Required: {rule.requirement}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-empty compact">
                      <strong>Rule audit unavailable</strong>
                      <span>
                        The signal is preserved, but this older export did not
                        include its rule-by-rule evaluation.
                      </span>
                    </div>
                  )}
                </section>

                {selectedStock.strategy ? (
                  <section className="reason-card strategy-review-card">
                    <div className="detail-section-title">
                      <div>
                        <span className="panel-kicker">
                          ACTIVE STRATEGY
                        </span>
                        <h3>
                          {selectedStock.strategy.strategyName ===
                          "FIBONACCI_61_8"
                            ? "Fibonacci 61.8% retracement"
                            : selectedStock.strategy.strategyName ??
                              "Strategy review"}
                        </h3>
                      </div>

                      <span className="strategy-paper-badge">
                        PAPER/PREVIEW — NOT SUBMITTED
                      </span>
                    </div>

                    {selectedStock.strategy.strategyStatus ? (
                      <p className="strategy-status-line">
                        {selectedStock.strategy.strategyStatus}
                      </p>
                    ) : null}

                    <div className="strategy-metric-grid">
                      <div>
                        <small>Confirmation time</small>
                        <strong>
                          {selectedStock.strategy.confirmationTime ??
                            "Not confirmed"}
                        </strong>
                      </div>

                      <div>
                        <small>61.8% retracement</small>
                        <strong>
                          {selectedStock.strategy.retracementPrice !==
                          undefined
                            ? money(
                                selectedStock.strategy.retracementPrice,
                              )
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Reward / risk</small>
                        <strong>
                          {selectedStock.strategy.rewardRisk !== undefined
                            ? `${selectedStock.strategy.rewardRisk.toFixed(
                                2,
                              )}×`
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Impulse strength</small>
                        <strong>
                          {selectedStock.strategy.impulseAtrMultiple !==
                          undefined
                            ? `${selectedStock.strategy.impulseAtrMultiple.toFixed(
                                2,
                              )} ATR`
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Pullback volume</small>
                        <strong>
                          {selectedStock.strategy.pullbackVolumeRatio !==
                          undefined
                            ? `${selectedStock.strategy.pullbackVolumeRatio.toFixed(
                                2,
                              )}×`
                            : "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Order status</small>
                        <strong className="negative">
                          NOT SUBMITTED
                        </strong>
                      </div>
                    </div>

                    {selectedStock.levels ? (
                      <div className="strategy-level-grid">
                        <div>
                          <small>Entry</small>
                          <strong>
                            {money(selectedStock.levels.buy)}
                          </strong>
                        </div>

                        <div>
                          <small>Target</small>
                          <strong>
                            {money(selectedStock.levels.target)}
                          </strong>
                        </div>

                        <div>
                          <small>Structural stop</small>
                          <strong>
                            {money(selectedStock.levels.stop)}
                          </strong>
                        </div>

                        <div>
                          <small>Trading stop</small>
                          <strong>
                            {money(selectedStock.levels.tradingStop)}
                          </strong>
                        </div>
                      </div>
                    ) : null}

                    {selectedStock.strategy.rejectionReason ? (
                      <div className="strategy-rejection">
                        <small>Why there is no trade</small>
                        <strong>
                          {selectedStock.strategy.rejectionReason
                            .replaceAll("_", " ")
                            .toLowerCase()}
                        </strong>

                        {selectedStock.strategy.detail ? (
                          <span>
                            {selectedStock.strategy.detail}
                          </span>
                        ) : null}
                      </div>
                    ) : selectedStock.strategy.detail ? (
                      <p className="strategy-detail">
                        {selectedStock.strategy.detail}
                      </p>
                    ) : null}
                  </section>
                ) : null}

                <section className="risk-card">
                  <div className="detail-section-title">
                    <div>
                      <span className="panel-kicker">PLANNING ESTIMATE</span>
                      <h3>Risk &amp; position size</h3>
                    </div>
                  </div>

                  {selectedStock.signal === "INVEST" && selectedStock.levels ? (
                    <>
                      <div className="risk-inputs">
                        <label>
                          Account size
                          <span>
                            $
                            <input
                              min="0"
                              onChange={(event) =>
                                setAccountSize(Math.max(Number(event.target.value), 0))
                              }
                              step="100"
                              type="number"
                              value={accountSize}
                            />
                          </span>
                        </label>
                        <label>
                          Max risk
                          <span>
                            <input
                              max="100"
                              min="0"
                              onChange={(event) =>
                                setRiskPercent(
                                  Math.min(Math.max(Number(event.target.value), 0), 100),
                                )
                              }
                              step="0.1"
                              type="number"
                              value={riskPercent}
                            />
                            %
                          </span>
                        </label>
                      </div>
                      <div className="trade-action-summary">
                        <div className="invest-dollars-primary">
                          <small>Invest dollars</small>
                          <strong>{money(requiredCapital)}</strong>
                          <span>
                            Total capital for the suggested position
                          </span>
                        </div>

                        <div className="buy-price-primary">
                          <small>Buy at</small>
                          <strong>
                            {money(selectedStock.levels.buy)}
                          </strong>
                          <span>Limit-buy price per share</span>
                        </div>
                      </div>

                      <div className="risk-results">
                        <div>
                          <small>Number of shares</small>
                          <strong>
                            {suggestedShares.toLocaleString()}
                          </strong>
                        </div>
                        <div>
                          <small>Trading stop loss</small>
                          <strong>
                            {money(selectedStock.levels.tradingStop)}
                          </strong>
                        </div>
                        <div>
                          <small>Sell target</small>
                          <strong>
                            {money(selectedStock.levels.target)}
                          </strong>
                        </div>
                        <div>
                          <small>Maximum loss</small>
                          <strong>{money(maximumLoss)}</strong>
                        </div>
                        <div>
                          <small>Risk budget</small>
                          <strong>{money(riskBudget)}</strong>
                        </div>
                        <div>
                          <small>Profit at target</small>
                          <strong>{money(potentialProfit)}</strong>
                        </div>
                        <div>
                          <small>Reward / risk</small>
                          <strong>{rewardRisk.toFixed(2)}×</strong>
                        </div>
                      </div>
                      {requiredCapital > accountSize ? (
                        <p className="capital-warning">
                          Position exceeds the account size. Reduce risk or cap
                          shares by available capital.
                        </p>
                      ) : null}
                      <p className="risk-note">
                        Uses the original trading stop loss as risk per share.
                        This calculator cannot place an order.
                      </p>

                      {selectedStock.webullPreview ? (
                        <div className="webull-preview-cap">
                          <div className="webull-preview-cap-heading">
                            <span>
                              WEBULL PREVIEW · NOT SUBMITTED
                            </span>
                            <strong>
                              {selectedStock.webullPreview.status}
                            </strong>
                          </div>

                          <div className="webull-preview-cap-grid">
                            <div>
                              <small>Preview quantity</small>
                              <strong>
                                {selectedStock.webullPreview.quantity ??
                                  "—"}
                              </strong>
                            </div>
                            <div>
                              <small>Position value</small>
                              <strong>
                                {selectedStock.webullPreview
                                  .estimatedPositionValue !==
                                undefined
                                  ? money(
                                      selectedStock.webullPreview
                                        .estimatedPositionValue,
                                    )
                                  : "—"}
                              </strong>
                            </div>
                            <div>
                              <small>Maximum position value</small>
                              <strong>
                                {selectedStock.webullPreview
                                  .maxPositionValue !== undefined
                                  ? money(
                                      selectedStock.webullPreview
                                        .maxPositionValue,
                                    )
                                  : "—"}
                              </strong>
                            </div>
                            <div>
                              <small>Sizing constraint</small>
                              <strong>
                                {selectedStock.webullPreview
                                  .sizingConstraint ?? "—"}
                              </strong>
                            </div>
                            <div>
                              <small>Planned risk</small>
                              <strong>
                                {selectedStock.webullPreview
                                  .plannedRisk !== undefined
                                  ? money(
                                      selectedStock.webullPreview
                                        .plannedRisk,
                                    )
                                  : "—"}
                              </strong>
                            </div>
                            <div>
                              <small>Submitted</small>
                              <strong className="negative">
                                NO
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="detail-empty compact">
                      <strong>No position sizing</strong>
                      <span>
                        Position sizing is shown only for complete INVEST signals
                        with verified strategy levels.
                      </span>
                    </div>
                  )}
                </section>
              </div>

              <section className="chart-card">
                <div className="detail-section-title">
                  <div>
                    <span className="panel-kicker">09:30–09:45 ET</span>
                    <h3>One-minute price action</h3>
                  </div>
                  <span>{selectedStock.minuteBars?.length ?? 0}/15 candles</span>
                </div>
                <PriceChart stock={selectedStock} />
              </section>

              <section className="outcome-card">
                <div className="detail-section-title">
                  <div>
                    <span className="panel-kicker">AFTER 09:45 ET</span>
                    <h3>Trade outcome</h3>
                  </div>
                  <OutcomeBadge outcome={selectedStock.outcome} />
                </div>
                {selectedStock.outcome ? (
                  <div className="outcome-grid">
                    <div>
                      <small>Entry</small>
                      <strong>
                        {selectedStock.outcome.entryPrice !== undefined
                          ? `${money(selectedStock.outcome.entryPrice)} at ${selectedStock.outcome.entryTime ?? "—"}`
                          : "Not reached"}
                      </strong>
                    </div>
                    <div>
                      <small>Exit</small>
                      <strong>
                        {selectedStock.outcome.exitPrice !== undefined
                          ? `${money(selectedStock.outcome.exitPrice)} at ${selectedStock.outcome.exitTime ?? "—"}`
                          : "No exit"}
                      </strong>
                    </div>
                    <div>
                      <small>P/L per share</small>
                      <strong
                        className={
                          (selectedStock.outcome.pnlPerShare ?? 0) >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {selectedStock.outcome.pnlPerShare !== undefined
                          ? signedMoney(selectedStock.outcome.pnlPerShare)
                          : "—"}
                      </strong>
                    </div>
                    <div>
                      <small>Return</small>
                      <strong>
                        {selectedStock.outcome.returnPct !== undefined
                          ? `${selectedStock.outcome.returnPct >= 0 ? "+" : ""}${selectedStock.outcome.returnPct.toFixed(2)}%`
                          : "—"}
                      </strong>
                    </div>
                    <p>{selectedStock.outcome.detail}</p>
                  </div>
                ) : (
                  <div className="detail-empty compact">
                    <strong>Outcome not calculated yet</strong>
                    <span>
                      The signal is preserved. A future enriched replay will
                      evaluate post-09:45 prices and report entry, exit, and
                      profit or loss without placing an order.
                    </span>
                  </div>
                )}
              </section>
            </section>
          ) : null}

          <section
            className="panel diagnosis-panel"
            id="stock-diagnosis"
          >
            <div className="panel-heading diagnosis-heading">
              <div>
                <span className="panel-kicker">
                  DECISION EXPLANATION
                </span>
                <h2>Stock Diagnosis</h2>
                <p>
                  Select a stock to see exactly why it was or
                  was not chosen by the active strategy.
                </p>
              </div>

              <div className="diagnosis-stock-picker">
                <label htmlFor="diagnosis-symbol">
                  Stock
                </label>
                <select
                  id="diagnosis-symbol"
                  onChange={(event) =>
                    setSelectedSymbol(event.target.value)
                  }
                  value={
                    selectedStock?.symbol ??
                    session.symbols[0]?.symbol ??
                    ""
                  }
                >
                  {session.symbols.map((stock) => (
                    <option
                      key={stock.symbol}
                      value={stock.symbol}
                    >
                      {stock.symbol} — {stock.signal}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStock ? (
              <div className="diagnosis-content">
                {selectedStock.barsProcessed <
                selectedStock.barsExpected ||
                selectedStock.signal === "WARNING" ? (
                  <section className="diagnosis-data-warning">
                    <div
                      className="diagnosis-data-warning-icon"
                      aria-hidden="true"
                    >
                      !
                    </div>

                    <div>
                      <span>DATA QUALITY WARNING</span>
                      <strong>
                        {selectedStock.barsProcessed} of{" "}
                        {selectedStock.barsExpected} opening bars
                        were available
                      </strong>
                      <p>
                        This symbol was not treated as fully
                        reliable. A data warning is separate from
                        failing a trading-strategy rule.
                      </p>
                    </div>
                  </section>
                ) : (
                  <section className="diagnosis-data-complete">
                    <span aria-hidden="true">✓</span>
                    <div>
                      <strong>Opening data complete</strong>
                      <small>
                        {selectedStock.barsProcessed}/
                        {selectedStock.barsExpected} opening bars
                        were available for evaluation.
                      </small>
                    </div>
                  </section>
                )}

                <section
                  className={`diagnosis-decision ${
                    selectedStock.signal === "INVEST"
                      ? "decision-invest"
                      : selectedStock.signal === "WARNING"
                        ? "decision-warning"
                        : "decision-no-invest"
                  }`}
                >
                  <div>
                    <span>Strategy decision</span>
                    <h3>{selectedStock.symbol}</h3>
                  </div>

                  <strong>{selectedStock.signal}</strong>

                  <p>
                    {diagnosisExplanation(selectedStock)}
                  </p>
                </section>

                <div className="diagnosis-grid">
                  <section className="diagnosis-card">
                    <span className="panel-kicker">
                      DECISION REASON
                    </span>
                    <h3>
                      Why {selectedStock.signal === "INVEST"
                        ? "it qualified"
                        : "it did not qualify"}
                    </h3>

                    <div className="diagnosis-general-explanation">
                      <strong>
                        {selectedStock.signal === "INVEST"
                          ? "Why it qualified"
                          : "General explanation"}
                      </strong>

                      {selectedStock.signal === "INVEST" ? (
                        selectedStock.rules?.some(
                          (rule) => rule.passed,
                        ) ? (
                          <ul className="diagnosis-qualified-list">
                            {selectedStock.rules
                              .filter((rule) => rule.passed)
                              .map((rule) => (
                                <li key={rule.label}>
                                  <span
                                    className="diagnosis-qualified-check"
                                    aria-hidden="true"
                                  >
                                    ✓
                                  </span>

                                  <div>
                                    <strong>{rule.label}</strong>
                                    <small>
                                      Actual: {rule.actual} · Required:{" "}
                                      {rule.requirement}
                                    </small>
                                  </div>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p>
                            This stored session marked the stock as INVEST,
                            but it did not include the rule-by-rule audit.
                            The dashboard will not invent missing reasons.
                          </p>
                        )
                      ) : (
                        <p>
                          {diagnosisExplanation(selectedStock)}
                        </p>
                      )}
                    </div>

                    {selectedStock.strategy
                      ?.rejectionReason ? (
                      <div className="diagnosis-rejection">
                        <span className="diagnosis-rejection-code">
                          {
                            selectedStock.strategy
                              .rejectionReason
                          }
                        </span>

                        <strong>
                          {
                            rejectionDefinition(
                              selectedStock.strategy
                                .rejectionReason,
                            ).title
                          }
                        </strong>

                        <p>
                          {selectedStock.strategy.detail ||
                            rejectionDefinition(
                              selectedStock.strategy
                                .rejectionReason,
                            ).explanation}
                        </p>

                        <div className="diagnosis-next-step">
                          <small>WHAT WOULD NEED TO CHANGE</small>
                          <span>
                            {
                              rejectionDefinition(
                                selectedStock.strategy
                                  .rejectionReason,
                              ).nextStep
                            }
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="diagnosis-rule-audit">
                      <div className="diagnosis-rule-audit-heading">
                        <div>
                          <span className="panel-kicker">
                            RULE AUDIT
                          </span>
                          <h4>Strategy checklist</h4>
                        </div>

                        <strong>
                          {selectedStock.rules?.filter(
                            (rule) => rule.passed,
                          ).length ?? 0}
                          /
                          {selectedStock.rules?.length ?? 0} passed
                        </strong>
                      </div>

                      {selectedStock.rules?.length ? (
                        <div className="diagnosis-rule-list">
                          {selectedStock.rules.map((rule) => (
                            <article
                              className={`diagnosis-rule ${
                                rule.passed
                                  ? "diagnosis-rule-pass"
                                  : "diagnosis-rule-fail"
                              }`}
                              key={rule.label}
                            >
                              <div
                                className="diagnosis-rule-result"
                                aria-hidden="true"
                              >
                                {rule.passed ? "✓" : "×"}
                              </div>

                              <div className="diagnosis-rule-copy">
                                <strong>{rule.label}</strong>

                                <dl>
                                  <div>
                                    <dt>Actual</dt>
                                    <dd>{rule.actual}</dd>
                                  </div>

                                  <div>
                                    <dt>Required</dt>
                                    <dd>{rule.requirement}</dd>
                                  </div>
                                </dl>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="diagnosis-rule-unavailable">
                          <strong>Rule audit unavailable</strong>
                          <p>
                            This stored session did not include the
                            rule-by-rule strategy evaluation. The
                            dashboard will not estimate or fabricate
                            missing rule results.
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="diagnosis-card">
                    <span className="panel-kicker">
                      SESSION INFORMATION
                    </span>
                    <h3>Data quality</h3>

                    <dl className="diagnosis-facts">
                      <div>
                        <dt>Trading date</dt>
                        <dd>{session.tradingDate}</dd>
                      </div>
                      <div>
                        <dt>Market-data feed</dt>
                        <dd>{session.dataFeed}</dd>
                      </div>
                      <div>
                        <dt>Opening bars</dt>
                        <dd>
                          {selectedStock.barsProcessed}/
                          {selectedStock.barsExpected}
                        </dd>
                      </div>
                      <div>
                        <dt>Data status</dt>
                        <dd>{selectedStock.detail}</dd>
                      </div>
                      <div>
                        <dt>Strategy</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.strategyName ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Submitted</dt>
                        <dd className="diagnosis-not-submitted">
                          NO
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="diagnosis-card diagnosis-card-wide">
                    <span className="panel-kicker">
                      STRATEGY MEASUREMENTS
                    </span>
                    <h3>Opening range and Fibonacci data</h3>

                    <dl className="diagnosis-metrics">
                      <div>
                        <dt>ATR</dt>
                        <dd>
                          {selectedStock.strategy?.atr !==
                          undefined
                            ? money(
                                selectedStock.strategy.atr,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Opening open</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.openingOpen !== undefined
                            ? money(
                                selectedStock.strategy
                                  .openingOpen,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Opening high</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.openingHigh !== undefined
                            ? money(
                                selectedStock.strategy
                                  .openingHigh,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Opening low</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.openingLow !== undefined
                            ? money(
                                selectedStock.strategy
                                  .openingLow,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Opening close</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.openingClose !== undefined
                            ? money(
                                selectedStock.strategy
                                  .openingClose,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Candle range</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.candleRange !== undefined
                            ? money(
                                selectedStock.strategy
                                  .candleRange,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Retracement price</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.retracementPrice !== undefined
                            ? money(
                                selectedStock.strategy
                                  .retracementPrice,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Impulse ATR multiple</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.impulseAtrMultiple !==
                          undefined
                            ? `${selectedStock.strategy.impulseAtrMultiple.toFixed(
                                3,
                              )}×`
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Pullback volume ratio</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.pullbackVolumeRatio !==
                          undefined
                            ? selectedStock.strategy.pullbackVolumeRatio.toFixed(
                                3,
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Confirmation time</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.confirmationTime || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Reward / risk</dt>
                        <dd>
                          {selectedStock.strategy
                            ?.rewardRisk !== undefined
                            ? `${selectedStock.strategy.rewardRisk.toFixed(
                                2,
                              )}×`
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="diagnosis-card diagnosis-card-wide">
                    <span className="panel-kicker">
                      TRADE INSTRUCTIONS
                    </span>
                    <h3>Entry, target and protection</h3>

                    {selectedStock.levels ? (
                      <div className="diagnosis-levels">
                        <div>
                          <span>Entry</span>
                          <strong>
                            {money(selectedStock.levels.buy)}
                          </strong>
                        </div>
                        <div>
                          <span>Target sell</span>
                          <strong>
                            {money(
                              selectedStock.levels.target,
                            )}
                          </strong>
                        </div>
                        <div>
                          <span>Structural stop</span>
                          <strong>
                            {money(
                              selectedStock.levels.stop,
                            )}
                          </strong>
                        </div>
                        <div>
                          <span>Trading stop loss</span>
                          <strong>
                            {money(
                              selectedStock.levels
                                .tradingStop,
                            )}
                          </strong>
                        </div>
                      </div>
                    ) : (
                      <div className="diagnosis-no-order">
                        <strong>No trade instructions</strong>
                        <span>
                          Entry, target and stop prices are
                          only produced for qualifying INVEST
                          signals.
                        </span>
                      </div>
                    )}

                    <div className="diagnosis-safety">
                      READ-ONLY · PAPER MODE · NOT SUBMITTED
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <div className="detail-empty">
                <strong>No stock selected</strong>
                <span>
                  Choose a stock from the selector or click a
                  stock in the Signals table.
                </span>
              </div>
            )}
          </section>

          <section
            className="comparison-page"
            aria-label="Run-to-run session comparison"
          >
            <div className="comparison-heading">
              <div>
                <span className="panel-kicker">
                  RUN-TO-RUN ANALYSIS
                </span>
                <h2>Session comparison</h2>
                <p>
                  Compares the two newest stored API sessions.
                  Fallback data is never silently used as the
                  previous session.
                </p>
              </div>

              <span className="comparison-count">
                {comparisonSessions.length} API{" "}
                {comparisonSessions.length === 1
                  ? "session"
                  : "sessions"}
              </span>
            </div>

            {comparisonCurrent && comparisonPrevious ? (
              <>
                <section className="comparison-session-pair">
                  <article>
                    <small>LATEST SESSION</small>
                    <strong>
                      {formatTradingDate(
                        comparisonCurrent.tradingDate,
                      )}
                    </strong>
                    <span>
                      {comparisonCurrent.source} ·{" "}
                      {comparisonCurrent.dataFeed} ·{" "}
                      {comparisonCurrent.status}
                    </span>
                    <time>
                      {formatUpdatedTime(
                        comparisonCurrent.updatedAt,
                      )}
                    </time>
                  </article>

                  <span
                    className="comparison-direction"
                    aria-hidden="true"
                  >
                    ←
                  </span>

                  <article>
                    <small>PREVIOUS SESSION</small>
                    <strong>
                      {formatTradingDate(
                        comparisonPrevious.tradingDate,
                      )}
                    </strong>
                    <span>
                      {comparisonPrevious.source} ·{" "}
                      {comparisonPrevious.dataFeed} ·{" "}
                      {comparisonPrevious.status}
                    </span>
                    <time>
                      {formatUpdatedTime(
                        comparisonPrevious.updatedAt,
                      )}
                    </time>
                  </article>
                </section>

                <section className="comparison-metrics">
                  <article>
                    <small>Market-data feed</small>
                    <strong>
                      {comparisonPrevious.dataFeed}
                      <span aria-hidden="true">→</span>
                      {comparisonCurrent.dataFeed}
                    </strong>
                    <p>
                      {comparisonPrevious.dataFeed ===
                      comparisonCurrent.dataFeed
                        ? "No feed change"
                        : "Feed changed between sessions"}
                    </p>
                  </article>

                  <article>
                    <small>Session status</small>
                    <strong>
                      {comparisonPrevious.status}
                      <span aria-hidden="true">→</span>
                      {comparisonCurrent.status}
                    </strong>
                    <p>
                      {comparisonPrevious.status ===
                      comparisonCurrent.status
                        ? "No status change"
                        : "Run status changed"}
                    </p>
                  </article>

                  <article>
                    <small>Opening completeness</small>
                    <strong>
                      {comparisonPreviousCompleteness.toFixed(1)}
                      %
                      <span aria-hidden="true">→</span>
                      {comparisonCurrentCompleteness.toFixed(1)}
                      %
                    </strong>
                    <p>
                      {comparisonCurrentBars}/
                      {comparisonCurrentExpectedBars} latest
                      opening bars
                    </p>
                  </article>

                  <article>
                    <small>INVEST signals</small>
                    <strong>
                      {comparisonPreviousSignals}
                      <span aria-hidden="true">→</span>
                      {comparisonCurrentSignals}
                    </strong>
                    <p>
                      {comparisonCurrentSignals -
                        comparisonPreviousSignals >=
                      0
                        ? "+"
                        : ""}
                      {comparisonCurrentSignals -
                        comparisonPreviousSignals}{" "}
                      from the previous session
                    </p>
                  </article>

                  <article>
                    <small>Data warnings</small>
                    <strong>
                      {comparisonPreviousWarnings}
                      <span aria-hidden="true">→</span>
                      {comparisonCurrentWarnings}
                    </strong>
                    <p>
                      {comparisonCurrentWarnings -
                        comparisonPreviousWarnings >=
                      0
                        ? "+"
                        : ""}
                      {comparisonCurrentWarnings -
                        comparisonPreviousWarnings}{" "}
                      from the previous session
                    </p>
                  </article>

                  <article>
                    <small>Decision changes</small>
                    <strong>{comparisonChanged.length}</strong>
                    <p>
                      {comparisonAdded.length} added ·{" "}
                      {comparisonRemoved.length} removed
                    </p>
                  </article>
                </section>

                <section className="comparison-symbol-summary">
                  <article className="comparison-added">
                    <header>
                      <div>
                        <small>SYMBOL UNIVERSE</small>
                        <h3>Added symbols</h3>
                      </div>
                      <strong>{comparisonAdded.length}</strong>
                    </header>

                    {comparisonAdded.length ? (
                      <div>
                        {comparisonAdded.map((row) => (
                          <span key={row.symbol}>
                            {row.symbol}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No symbols were added.</p>
                    )}
                  </article>

                  <article className="comparison-removed">
                    <header>
                      <div>
                        <small>SYMBOL UNIVERSE</small>
                        <h3>Removed symbols</h3>
                      </div>
                      <strong>{comparisonRemoved.length}</strong>
                    </header>

                    {comparisonRemoved.length ? (
                      <div>
                        {comparisonRemoved.map((row) => (
                          <span key={row.symbol}>
                            {row.symbol}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>No symbols were removed.</p>
                    )}
                  </article>
                </section>

                <section className="comparison-decision-panel">
                  <div className="comparison-panel-heading">
                    <div>
                      <span className="panel-kicker">
                        SYMBOL DECISIONS
                      </span>
                      <h3>Signal changes</h3>
                    </div>

                    <span>
                      {comparisonChanged.length} changed
                    </span>
                  </div>

                  <div
                    className="comparison-table"
                    role="table"
                    aria-label="Symbol decision comparison"
                  >
                    <div
                      className="comparison-row comparison-table-head"
                      role="row"
                    >
                      <span role="columnheader">Symbol</span>
                      <span role="columnheader">
                        Previous
                      </span>
                      <span role="columnheader">Latest</span>
                      <span role="columnheader">Change</span>
                    </div>

                    {comparisonRows.map((row) => (
                      <div
                        className="comparison-row"
                        key={row.symbol}
                        role="row"
                      >
                        <strong role="cell">
                          {row.symbol}
                        </strong>

                        <span role="cell">
                          {row.previousStock ? (
                            <span
                              className={`comparison-signal comparison-signal-${row.previousStock.signal
                                .toLowerCase()
                                .replaceAll(" ", "-")}`}
                            >
                              {row.previousStock.signal}
                            </span>
                          ) : (
                            <span className="comparison-missing">
                              Not tracked
                            </span>
                          )}
                        </span>

                        <span role="cell">
                          {row.currentStock ? (
                            <span
                              className={`comparison-signal comparison-signal-${row.currentStock.signal
                                .toLowerCase()
                                .replaceAll(" ", "-")}`}
                            >
                              {row.currentStock.signal}
                            </span>
                          ) : (
                            <span className="comparison-missing">
                              Not tracked
                            </span>
                          )}
                        </span>

                        <span role="cell">
                          <span
                            className={`comparison-change comparison-change-${row.change.toLowerCase()}`}
                          >
                            {row.change}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="comparison-note">
                  <span aria-hidden="true">i</span>
                  <div>
                    <strong>
                      Comparison is descriptive only
                    </strong>
                    <p>
                      Changes show differences between stored
                      session records. They do not indicate that
                      an order was sent to a broker.
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <section className="comparison-unavailable">
                <span aria-hidden="true">↔</span>
                <div>
                  <strong>
                    Two API sessions are required
                  </strong>
                  <p>
                    The dashboard currently has{" "}
                    {comparisonSessions.length} verified API{" "}
                    {comparisonSessions.length === 1
                      ? "session"
                      : "sessions"}. A comparison will appear after
                    another stored session is available.
                  </p>
                  <small>
                    Fallback data is intentionally excluded.
                  </small>
                </div>
              </section>
            )}
          </section>

          <section className="panel history-panel" id="history">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">STORED RESULTS</span>
                <h2>Session history</h2>
              </div>
              <span className="history-count">
                {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
              </span>
            </div>
            <div className="history-table" role="table" aria-label="Session history">
              <div className="history-row table-head" role="row">
                <span role="columnheader">Trading date</span>
                <span role="columnheader">Mode</span>
                <span role="columnheader">Data</span>
                <span role="columnheader">Signals</span>
                <span role="columnheader">Outcomes</span>
                <span role="columnheader">View</span>
              </div>
              {sessions.map((storedSession) => {
                const storedSignals = storedSession.symbols.filter(
                  (stock) => stock.signal === "INVEST",
                );
                const storedOutcomes = storedSignals.filter(
                  (stock) => stock.outcome,
                );

                return (
                  <div className="history-row" key={storedSession.id} role="row">
                    <strong role="cell">
                      {formatTradingDate(storedSession.tradingDate)}
                    </strong>
                    <span role="cell">{storedSession.source}</span>
                    <span role="cell">
                      <span
                        className={`session-status ${storedSession.status.toLowerCase()}`}
                      >
                        {storedSession.dataFeed} · {storedSession.status}
                      </span>
                    </span>
                    <span role="cell">{storedSignals.length} INVEST</span>
                    <span role="cell">
                      {storedOutcomes.length}/{storedSignals.length} calculated
                    </span>
                    <span role="cell">
                      <button
                        aria-pressed={session.id === storedSession.id}
                        className="history-view"
                        onClick={() => {
                          setSession(storedSession);
                          setSelectedSymbol(null);
                          showSymbolView("all");
                        }}
                        type="button"
                      >
                        {session.id === storedSession.id ? "Viewing" : "Open"}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel performance-panel" id="performance">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">REPLAY ANALYTICS</span>
                <h2>Strategy performance</h2>
              </div>
              <span className="performance-scope">
                Per-share results · {sessions.length} stored{" "}
                {sessions.length === 1 ? "session" : "sessions"}
              </span>
            </div>

            {outcomeSymbols.length > 0 ? (
              <>
                <div className="performance-grid">
                  <div>
                    <small>Resolved trades</small>
                    <strong>{resolvedTrades}</strong>
                    <span>{wins.length} wins · {losses.length} losses</span>
                  </div>
                  <div>
                    <small>Win rate</small>
                    <strong>{winRate.toFixed(1)}%</strong>
                    <span>Excludes no-entry and open results</span>
                  </div>
                  <div>
                    <small>Net P/L</small>
                    <strong className={totalPnlPerShare >= 0 ? "positive" : "negative"}>
                      {signedMoney(totalPnlPerShare)}
                    </strong>
                    <span>Per share across calculated outcomes</span>
                  </div>
                  <div>
                    <small>Average return</small>
                    <strong>
                      {averageReturn >= 0 ? "+" : ""}
                      {averageReturn.toFixed(2)}%
                    </strong>
                    <span>Resolved entries only</span>
                  </div>
                  <div>
                    <small>Profit factor</small>
                    <strong>
                      {profitFactor === null ? "—" : profitFactor.toFixed(2)}
                    </strong>
                    <span>Gross profit ÷ gross loss</span>
                  </div>
                  <div>
                    <small>Unresolved</small>
                    <strong>{noEntries.length + openTrades.length}</strong>
                    <span>
                      {noEntries.length} no entry · {openTrades.length} still open
                    </span>
                  </div>
                </div>

                <div className="outcome-ledger">
                  {outcomeSymbols.map((stock) => (
                    <div
                      className="outcome-ledger-row"
                      key={`${stock.sessionId}-${stock.symbol}`}
                    >
                      <span>
                        <strong>{stock.symbol}</strong>
                        <small>
                          {stock.tradingDate} · {stock.source}
                        </small>
                      </span>
                      <OutcomeBadge outcome={stock.outcome} />
                      <strong>
                        {stock.outcome?.pnlPerShare !== undefined
                          ? signedMoney(stock.outcome.pnlPerShare)
                          : "—"}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="analytics-empty">
                <strong>Performance metrics are ready for real outcomes</strong>
                <p>
                  Existing sessions do not contain post-09:45 outcome data.
                  Once the Python replay exports it, this panel will calculate
                  win rate, returns, profit factor, and the result of every
                  INVEST signal automatically.
                </p>
                <span>No results are estimated or fabricated.</span>
              </div>
            )}
          </section>

          <section className="panel replay-panel" id="replay">
            <div className="replay-copy">
              <span className="panel-kicker">HISTORICAL REPLAY</span>
              <h2>{displayDate} opening session</h2>
              <p>
                Fifteen one-minute bars were revealed sequentially from 09:30
                to 09:45 ET. No spreadsheet or order workflow was used.
              </p>
              <span className="demo-label">
                {dataState === "current"
                  ? "Stored session · read-only API"
                  : dataState === "loading"
                    ? "Checking for latest stored session"
                    : "Verified fallback snapshot"}
              </span>
            </div>

            <div className="replay-timeline" aria-label="Replay timeline">
              <div className="timeline-meta">
                <strong>09:30</strong>
                <span aria-live="polite">
                  {replayStatus === "running"
                    ? `Replaying minute ${replayStep + 1} of 15`
                    : replayStatus === "paused"
                      ? `Paused at ${replayTime}`
                      : "15 virtual minutes"}
                </span>
                <strong>{replayTime}</strong>
              </div>
              <div className="timeline-track">
                <span style={{ width: replayPercent }} />
                <i style={{ left: `calc(${replayPercent} - 5px)` }} />
              </div>
              <div className="timeline-labels">
                <span>Opening bell</span>
                <span>
                  {replayStatus === "complete" ? "Strategy evaluated" : "Signal pending"}
                </span>
              </div>
            </div>

            <div className="replay-actions">
              <button
                className="playback-button"
                onClick={toggleReplay}
                type="button"
              >
                <span aria-hidden="true">
                  {replayStatus === "running" ? "Ⅱ" : "▶"}
                </span>
                {replayStatus === "running"
                  ? "Pause"
                  : replayStatus === "paused"
                    ? "Resume"
                    : "Replay again"}
              </button>
              <div className="locked-control">
                <span aria-hidden="true">▣</span>
                <div>
                  <strong>Read-only interface</strong>
                  <small>Order placement disabled</small>
                </div>
              </div>
            </div>
          </section>

          <section className="audit-note" id="audit">
            <span className="audit-icon" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>Replay completed safely</strong>
              <p>
                {signals} strategy signals recorded · {warnings} incomplete
                symbol rejected · 0 orders submitted
              </p>
            </div>
            <time>{updatedTime}</time>
          </section>
        </div>
      </section>
    </main>
  );
}
