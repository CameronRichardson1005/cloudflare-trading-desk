export type DashboardRuntimeEnv = {
  DB?: D1Database;
  DASHBOARD_INGEST_KEY?: string;
};

declare global {
  var __TRADING_DASHBOARD_ENV__: DashboardRuntimeEnv | undefined;
}

export function setDashboardRuntimeEnv(env: DashboardRuntimeEnv) {
  globalThis.__TRADING_DASHBOARD_ENV__ = env;
}

export function getDashboardRuntimeEnv(): DashboardRuntimeEnv {
  return globalThis.__TRADING_DASHBOARD_ENV__ ?? {};
}
