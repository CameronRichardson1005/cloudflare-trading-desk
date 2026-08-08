function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function validatePaperPerformance(
  value: unknown,
): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  const report = value as Record<string, unknown>;

  const nonNegativeInteger = (candidate: unknown) =>
    Number.isInteger(candidate) &&
    Number(candidate) >= 0;

  const optionalFiniteNumber = (candidate: unknown) =>
    candidate === null || validNumber(candidate);

  const validTrade = (candidate: unknown) => {
    if (!candidate || typeof candidate !== "object") {
      return false;
    }

    const trade = candidate as Record<string, unknown>;

    return (
      (
        trade.symbol === null ||
        typeof trade.symbol === "string"
      ) &&
      optionalFiniteNumber(trade.pnl)
    );
  };

  return (
    /^\d{4}-\d{2}-\d{2}$/.test(String(report.date)) &&
    nonNegativeInteger(report.ordersApproved) &&
    nonNegativeInteger(report.tradesEntered) &&
    nonNegativeInteger(report.openTrades) &&
    nonNegativeInteger(report.closedTrades) &&
    nonNegativeInteger(report.noEntry) &&
    nonNegativeInteger(report.targetExits) &&
    nonNegativeInteger(report.stopExits) &&
    nonNegativeInteger(report.timeExits) &&
    nonNegativeInteger(report.profitableTrades) &&
    nonNegativeInteger(report.losingTrades) &&
    nonNegativeInteger(report.breakevenTrades) &&
    optionalFiniteNumber(report.winRatePct) &&
    (
      report.winRatePct === null ||
      (
        Number(report.winRatePct) >= 0 &&
        Number(report.winRatePct) <= 100
      )
    ) &&
    validNumber(report.realizedPnl) &&
    optionalFiniteNumber(report.averagePnlPerTrade) &&
    optionalFiniteNumber(report.averageReturnPct) &&
    optionalFiniteNumber(report.averageWinner) &&
    optionalFiniteNumber(report.averageLoser) &&
    optionalFiniteNumber(report.expectancyPerTrade) &&
    optionalFiniteNumber(report.averageMfePct) &&
    optionalFiniteNumber(report.averageMaePct) &&
    validTrade(report.bestTrade) &&
    validTrade(report.worstTrade) &&
    report.simulationOnly === true &&
    report.brokerSubmitted === false &&
    Number(report.tradesEntered) <=
      Number(report.ordersApproved) &&
    Number(report.closedTrades) <=
      Number(report.tradesEntered) &&
    Number(report.openTrades) +
      Number(report.closedTrades) <=
      Number(report.tradesEntered) &&
    Number(report.noEntry) <=
      Number(report.ordersApproved)
  );
}
