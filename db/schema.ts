import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tradingSessions = sqliteTable("trading_sessions", {
  id: text("id").primaryKey(),
  tradingDate: text("trading_date").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  updatedAt: text("updated_at").notNull(),
  totalBars: integer("total_bars").notNull(),
  expectedBars: integer("expected_bars").notNull(),
  payload: text("payload").notNull(),
});
