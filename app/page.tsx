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

function Metric({
  label,
  value,
  tone = "cyan",
  glyph,
  active = false,
  onClick,
}: {
  label: string;
  value: string;
  tone?: "cyan" | "coral";
  glyph: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`metric-card ${tone} ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <div className="metric-glyph" aria-hidden="true">
        {glyph}
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
  const [activeSection, setActiveSection] = useState<
    "overview" | "symbols" | "history" | "performance" | "replay" | "audit"
  >("overview");
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

  useEffect(() => {
    const sectionIds = [
      "overview",
      "symbols",
      "history",
      "performance",
      "replay",
      "audit",
    ] as const;
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleSection) {
          setActiveSection(
            visibleSection.target.id as
              | "overview"
              | "symbols"
              | "history"
              | "performance"
              | "replay"
              | "audit",
          );
        }
      },
      {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0, 0.15, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const navigateTo = (
    section:
      | "overview"
      | "symbols"
      | "history"
      | "performance"
      | "replay"
      | "audit",
  ) => {
    setActiveSection(section);
    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const showSymbolView = (
    nextFilter: "all" | "complete" | "signals" | "warnings",
  ) => {
    setFilter(nextFilter);
    setActiveSection("symbols");
    document.getElementById("symbols")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
      <aside className="sidebar">
        <div className="sidebar-top">
          <Mark />
          <section className="session-block">
            <p className="eyebrow">Session</p>
            <div className="session-date">
              <Icon name="calendar" />
              <span>{displayDate}</span>
            </div>
            <div className="safe-pill">◆ READ-ONLY · PAPER MODE</div>
          </section>

          <nav aria-label="Dashboard sections" className="nav-list">
            <button
              aria-current={activeSection === "overview" ? "page" : undefined}
              className={`nav-item ${activeSection === "overview" ? "active" : ""}`}
              onClick={() => navigateTo("overview")}
              type="button"
            >
              <Icon name="overview" />
              <span>Overview</span>
            </button>
            <button
              aria-current={activeSection === "symbols" ? "page" : undefined}
              className={`nav-item ${activeSection === "symbols" ? "active" : ""}`}
              onClick={() => showSymbolView("signals")}
              type="button"
            >
              <Icon name="signals" />
              <span>Signals</span>
            </button>
            <button
              aria-current={activeSection === "history" ? "page" : undefined}
              className={`nav-item ${activeSection === "history" ? "active" : ""}`}
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
              onClick={() => navigateTo("performance")}
              type="button"
            >
              <Icon name="performance" />
              <span>Performance</span>
            </button>
            <button
              aria-current={activeSection === "replay" ? "page" : undefined}
              className={`nav-item ${activeSection === "replay" ? "active" : ""}`}
              onClick={() => navigateTo("replay")}
              type="button"
            >
              <Icon name="replay" />
              <span>Replay</span>
            </button>
            <button
              aria-current={activeSection === "audit" ? "page" : undefined}
              className={`nav-item ${activeSection === "audit" ? "active" : ""}`}
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

      <section className="workspace" id="overview">
        <header className="topbar">
          <div>
            <p className="mobile-kicker">SESSION COCKPIT</p>
            <h1>Cameron&apos;s Trading Desk</h1>
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

        <div className="content">
          <section className="status-strip" aria-label="Replay summary">
            <Metric
              glyph="◎"
              label="Complete symbols"
              value={`${completeSymbols}/${session.symbols.length}`}
              active={filter === "complete"}
              onClick={() => showSymbolView("complete")}
            />
            <Metric
              glyph="◫"
              label="Bars loaded"
              value={`${totalBars}/${expectedBars}`}
              active={filter === "all"}
              onClick={() => showSymbolView("all")}
            />
            <Metric
              glyph="↗"
              label="INVEST signals"
              value={String(signals)}
              active={filter === "signals"}
              onClick={() => showSymbolView("signals")}
            />
            <Metric
              glyph="!"
              label="Data warning"
              tone="coral"
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
                  <span role="columnheader">Order plan</span>
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
                        setSelectedSymbol(stock.symbol)
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

                            <span className="order-plan-levels">
                              <span>
                                Target{" "}
                                <b>
                                  {money(
                                    stock.levels.target,
                                  )}
                                </b>
                              </span>
                              <span>
                                Stop{" "}
                                <b>
                                  {money(
                                    stock.levels
                                      .tradingStop,
                                  )}
                                </b>
                              </span>
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
