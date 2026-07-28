CREATE TABLE `trading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`trading_date` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`updated_at` text NOT NULL,
	`total_bars` integer NOT NULL,
	`expected_bars` integer NOT NULL,
	`payload` text NOT NULL
);
