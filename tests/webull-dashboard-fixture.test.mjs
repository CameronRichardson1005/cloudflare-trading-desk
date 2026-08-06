import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  validateWebullApprovals,
  validateWebullSafety,
} from "../db/webull-approval-safety.ts";

const fixture = JSON.parse(
  await readFile(
    new URL(
      "./webull-dashboard-fixture.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("accepts Python-generated approval fixture", () => {
  assert.equal(
    validateWebullApprovals(
      fixture.webullApprovals,
    ),
    true,
  );

  assert.equal(
    validateWebullSafety(
      fixture.webullSafety,
    ),
    true,
  );
});

test("fixture remains preview-only", () => {
  const preview =
    fixture.symbols[0].webullPreview;

  assert.equal(preview.submitted, false);
  assert.equal(
    fixture.webullSafety.manualApprovalRequired,
    true,
  );
  assert.equal(
    fixture.webullSafety.killSwitchActive,
    true,
  );
  assert.equal(
    fixture.webullSafety.submissionEnabled,
    false,
  );
});

test("fixture contains no sensitive approval fields", () => {
  const serialized = JSON.stringify(fixture);

  assert.doesNotMatch(
    serialized,
    /approvalToken/,
  );
  assert.doesNotMatch(
    serialized,
    /tokenHash/,
  );
  assert.doesNotMatch(
    serialized,
    /proposalFingerprint/,
  );
  assert.doesNotMatch(
    serialized,
    /accountId/,
  );
});
