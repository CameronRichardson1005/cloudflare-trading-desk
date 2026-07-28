/** Cloudflare Worker entry point for the standalone Trading Desk. */
import handler from "vinext/server/app-router-entry";
import { setDashboardRuntimeEnv } from "../db/runtime-env";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DASHBOARD_INGEST_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    setDashboardRuntimeEnv(env);
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
