import type {
  WebullApprovalSummary,
  WebullSafetyStatus,
} from "./sessions";

const ALLOWED_APPROVAL_KEYS = new Set([
  "symbol",
  "quantity",
  "limitPrice",
  "proposedExposure",
  "status",
  "createdAt",
  "expiresAt",
  "approvedAt",
  "consumedAt",
]);

const APPROVAL_STATUSES = new Set([
  "PENDING",
  "APPROVED",
  "EXPIRED",
  "CONSUMED",
]);

function validPositiveNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function validTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !Number.isNaN(Date.parse(value))
  );
}

export function validateWebullApproval(
  value: unknown,
): value is WebullApprovalSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const approval = value as Record<string, unknown>;
  const keys = Object.keys(approval);

  if (keys.some((key) => !ALLOWED_APPROVAL_KEYS.has(key))) {
    return false;
  }

  return (
    typeof approval.symbol === "string" &&
    /^[A-Z][A-Z0-9.-]{0,9}$/.test(approval.symbol) &&
    Number.isInteger(approval.quantity) &&
    Number(approval.quantity) > 0 &&
    validPositiveNumber(approval.limitPrice) &&
    validPositiveNumber(approval.proposedExposure) &&
    APPROVAL_STATUSES.has(String(approval.status)) &&
    validTimestamp(approval.createdAt) &&
    validTimestamp(approval.expiresAt) &&
    (
      approval.approvedAt === undefined ||
      validTimestamp(approval.approvedAt)
    ) &&
    (
      approval.consumedAt === undefined ||
      validTimestamp(approval.consumedAt)
    )
  );
}

export function validateWebullApprovals(
  value: unknown,
): value is WebullApprovalSummary[] | undefined {
  return (
    value === undefined ||
    (
      Array.isArray(value) &&
      value.length <= 100 &&
      value.every(validateWebullApproval)
    )
  );
}

export function validateWebullSafety(
  value: unknown,
): value is WebullSafetyStatus | undefined {
  if (value === undefined) return true;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const safety = value as Record<string, unknown>;
  const keys = Object.keys(safety).sort();

  return (
    keys.length === 3 &&
    keys[0] === "killSwitchActive" &&
    keys[1] === "manualApprovalRequired" &&
    keys[2] === "submissionEnabled" &&
    safety.manualApprovalRequired === true &&
    safety.killSwitchActive === true &&
    safety.submissionEnabled === false
  );
}
