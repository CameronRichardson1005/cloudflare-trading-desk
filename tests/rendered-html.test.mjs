import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /READ-ONLY/);
  assert.match(html, /Historical/);
  assert.match(html, /SIP/);
  assert.match(html, /Invest dollars/);
  assert.match(html, /Buy at/);
  assert.match(html, /Order placement disabled/);
  assert.match(html, /0 orders submitted/);
  assert.match(html, /PAPER\/PREVIEW — NOT SUBMITTED/);
  assert.match(html, /Session history/);
  assert.match(html, /Strategy performance/);
  assert.match(html, /Performance metrics are ready for real outcomes/);
});
