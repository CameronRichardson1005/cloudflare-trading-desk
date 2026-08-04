import type { TradingSession } from "./sessions";

export function suppressUnsafeLevels(
  session: TradingSession,
): TradingSession {
  const symbols = session.symbols.map((symbol) => {
    const complete =
      symbol.barsProcessed >= symbol.barsExpected &&
      symbol.detail.toLowerCase() === "complete";

    if (!complete) {
      return {
        ...symbol,
        signal: "WARNING" as const,
        levels: undefined,
        outcome: undefined,
      };
    }

    if (symbol.signal !== "INVEST") {
      return {
        ...symbol,
        levels: undefined,
        outcome: undefined,
      };
    }

    return symbol;
  });

  const allComplete = symbols.every(
    (symbol) => symbol.barsProcessed >= symbol.barsExpected,
  );

  return {
    ...session,
    status: allComplete ? session.status : "INCOMPLETE",
    symbols,
  };
}
