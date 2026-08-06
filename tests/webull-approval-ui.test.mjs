import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const pageSource = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);

test("renders read-only Webull approval status", () => {
  assert.match(
    pageSource,
    /WEBULL APPROVAL STATUS · READ ONLY/,
  );
  assert.match(
    pageSource,
    /Order submission/,
  );
  assert.match(
    pageSource,
    /Dashboard controls/,
  );
});

test("does not render an approval or submission button", () => {
  assert.doesNotMatch(
    pageSource,
    /<button[^>]*>\s*Approve/i,
  );
  assert.doesNotMatch(
    pageSource,
    /<button[^>]*>\s*Submit/i,
  );
});

test("does not reference sensitive approval fields", () => {
  assert.doesNotMatch(
    pageSource,
    /approvalToken/,
  );
  assert.doesNotMatch(
    pageSource,
    /tokenHash/,
  );
  assert.doesNotMatch(
    pageSource,
    /proposalFingerprint/,
  );
  assert.doesNotMatch(
    pageSource,
    /accountId/,
  );
});
