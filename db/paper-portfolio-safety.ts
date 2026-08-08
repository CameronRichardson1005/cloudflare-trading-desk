function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function nonNegativeNumber(value: unknown): boolean {
  return validNumber(value) && value >= 0;
}

function nonNegativeInteger(value: unknown): boolean {
  return Number.isInteger(value) && Number(value) >= 0;
}

function validTimestamp(value: unknown): boolean {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function validateOpenPosition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const position = value as Record<string, unknown>;

  return (
    typeof position.paperOrderId === "string" &&
    position.paperOrderId.length > 0 &&
    typeof position.symbol === "string" &&
    position.symbol.length > 0 &&
    Number.isInteger(position.quantity) &&
    Number(position.quantity) > 0 &&
    validNumber(position.fillPrice) &&
    Number(position.fillPrice) > 0 &&
    nonNegativeNumber(position.costBasis) &&
    validNumber(position.markPrice) &&
    Number(position.markPrice) > 0 &&
    ["MARKED", "FILL FALLBACK"].includes(
      String(position.markStatus),
    ) &&
    nonNegativeNumber(position.marketValue) &&
    validNumber(position.unrealizedPnl) &&
    validNumber(position.unrealizedReturnPct) &&
    validTimestamp(position.filledAt) &&
    (
      position.targetPrice === null ||
      (
        validNumber(position.targetPrice) &&
        Number(position.targetPrice) > 0
      )
    ) &&
    (
      position.stopPrice === null ||
      (
        validNumber(position.stopPrice) &&
        Number(position.stopPrice) > 0
      )
    )
  );
}

function validateClosedPosition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  const position = value as Record<string, unknown>;

  return (
    typeof position.paperOrderId === "string" &&
    position.paperOrderId.length > 0 &&
    typeof position.symbol === "string" &&
    position.symbol.length > 0 &&
    Number.isInteger(position.quantity) &&
    Number(position.quantity) > 0 &&
    validNumber(position.fillPrice) &&
    Number(position.fillPrice) > 0 &&
    validNumber(position.exitPrice) &&
    Number(position.exitPrice) > 0 &&
    validNumber(position.realizedPnl) &&
    validNumber(position.returnPct) &&
    typeof position.exitReason === "string" &&
    position.exitReason.length > 0 &&
    validTimestamp(position.filledAt) &&
    validTimestamp(position.closedAt)
  );
}

export function validatePaperPortfolio(
  value: unknown,
): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;

  const portfolio = value as Record<string, unknown>;

  if (
    !nonNegativeNumber(portfolio.startingCash) ||
    Number(portfolio.startingCash) <= 0 ||
    !validNumber(portfolio.cash) ||
    !nonNegativeNumber(portfolio.buyingPower) ||
    !nonNegativeNumber(portfolio.openCostBasis) ||
    !nonNegativeNumber(portfolio.marketValue) ||
    !validNumber(portfolio.realizedPnl) ||
    !validNumber(portfolio.unrealizedPnl) ||
    !validNumber(portfolio.totalPnl) ||
    !validNumber(portfolio.equity) ||
    !nonNegativeInteger(portfolio.openPositionCount) ||
    !nonNegativeInteger(portfolio.closedPositionCount) ||
    !nonNegativeInteger(portfolio.pendingOrderCount) ||
    !nonNegativeInteger(portfolio.noEntryCount) ||
    typeof portfolio.overdrawn !== "boolean" ||
    portfolio.simulationOnly !== true ||
    portfolio.brokerSubmitted !== false ||
    !Array.isArray(portfolio.openPositions) ||
    !Array.isArray(portfolio.closedPositions) ||
    !portfolio.openPositions.every(validateOpenPosition) ||
    !portfolio.closedPositions.every(validateClosedPosition)
  ) {
    return false;
  }

  if (
    portfolio.openPositions.length !==
      Number(portfolio.openPositionCount) ||
    portfolio.closedPositions.length !==
      Number(portfolio.closedPositionCount)
  ) {
    return false;
  }

  if (
    Number(portfolio.buyingPower) <
    Math.max(Number(portfolio.cash), 0) - 0.01
  ) {
    return false;
  }

  if (
    Math.abs(
      Number(portfolio.totalPnl) -
      (
        Number(portfolio.realizedPnl) +
        Number(portfolio.unrealizedPnl)
      ),
    ) > 0.01
  ) {
    return false;
  }

  if (
    Math.abs(
      Number(portfolio.equity) -
      (
        Number(portfolio.cash) +
        Number(portfolio.marketValue)
      ),
    ) > 0.01
  ) {
    return false;
  }

  if (
    portfolio.overdrawn !==
      (Number(portfolio.cash) < 0)
  ) {
    return false;
  }

  return true;
}
