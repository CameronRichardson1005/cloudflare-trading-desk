import assert from "node:assert/strict";
import test from "node:test";

import {
  validateWebullApproval,
  validateWebullApprovals,
  validateWebullSafety,
} from "../db/webull-approval-safety.ts";

function validApproval(overrides = {}) {
  return {
    symbol: "OPEN",
    quantity: 10,
    limitPrice: 4.25,
    proposedExposure: 42.5,
    status: "PENDING",
    createdAt: "2026-08-06T18:00:00Z",
    expiresAt: "2026-08-06T18:05:00Z",
    ...overrides,
  };
}

test("accepts a redacted approval summary", () => {
  assert.equal(
    validateWebullApproval(validApproval()),
    true,
  );
});

test("accepts approved and consumed timestamps", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        status: "CONSUMED",
        approvedAt: "2026-08-06T18:01:00Z",
        consumedAt: "2026-08-06T18:02:00Z",
      }),
    ),
    true,
  );
});

test("rejects approval tokens", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        approvalToken: "secret",
      }),
    ),
    false,
  );
});

test("rejects token hashes", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        tokenHash: "hashed-secret",
      }),
    ),
    false,
  );
});

test("rejects proposal fingerprints", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        proposalFingerprint: "fingerprint",
      }),
    ),
    false,
  );
});

test("rejects account identifiers", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        accountId: "account-secret",
      }),
    ),
    false,
  );
});

test("rejects invalid approval status", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        status: "SUBMITTED",
      }),
    ),
    false,
  );
});

test("rejects invalid numeric values", () => {
  assert.equal(
    validateWebullApproval(
      validApproval({
        proposedExposure: 0,
      }),
    ),
    false,
  );
});

test("accepts an empty approval list", () => {
  assert.equal(
    validateWebullApprovals([]),
    true,
  );
});

test("rejects excessive approval records", () => {
  assert.equal(
    validateWebullApprovals(
      Array.from(
        { length: 101 },
        () => validApproval(),
      ),
    ),
    false,
  );
});

test("accepts only the fail-closed safety state", () => {
  assert.equal(
    validateWebullSafety({
      manualApprovalRequired: true,
      killSwitchActive: true,
      submissionEnabled: false,
    }),
    true,
  );
});

test("rejects submission-enabled safety state", () => {
  assert.equal(
    validateWebullSafety({
      manualApprovalRequired: true,
      killSwitchActive: true,
      submissionEnabled: true,
    }),
    false,
  );
});

test("rejects inactive kill switch", () => {
  assert.equal(
    validateWebullSafety({
      manualApprovalRequired: true,
      killSwitchActive: false,
      submissionEnabled: false,
    }),
    false,
  );
});

test("rejects extra safety fields", () => {
  assert.equal(
    validateWebullSafety({
      manualApprovalRequired: true,
      killSwitchActive: true,
      submissionEnabled: false,
      accountId: "hidden-account",
    }),
    false,
  );
});
