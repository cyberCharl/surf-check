import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

/**
 * A configured surf spot (populated from config, cached in DB for FK references).
 */
export const spots = sqliteTable("spots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  idealMinHeight: real("ideal_min_height"),
  idealMaxHeight: real("ideal_max_height"),
  offshoreWindDirs: text("offshore_wind_dirs"), // JSON array of directions
  sourceUrls: text("source_urls"), // JSON Record<source, url> from config
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * A single scrape run. One run = one cron execution that scrapes all spots/sources.
 */
export const scrapeRuns = sqliteTable("scrape_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  forecastDate: text("forecast_date").notNull(), // YYYY-MM-DD — the date being forecast
  scrapedAt: integer("scraped_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  status: text("status", { enum: ["complete", "partial", "failed"] })
    .notNull()
    .default("complete"),
  metadata: text("metadata"), // JSON — any run-level notes
})

/**
 * Per-spot, per-source forecast data from a scrape run.
 */
export const forecasts = sqliteTable("forecasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scrapeRunId: integer("scrape_run_id")
    .notNull()
    .references(() => scrapeRuns.id),
  spotId: integer("spot_id")
    .notNull()
    .references(() => spots.id),
  source: text("source").notNull(), // e.g. "surf-forecast", "surfline", "windguru"
  forecastDate: text("forecast_date").notNull(), // YYYY-MM-DD

  // Wave data
  waveHeightMin: real("wave_height_min"), // metres
  waveHeightMax: real("wave_height_max"), // metres
  wavePeriod: real("wave_period"), // seconds
  swellDirection: text("swell_direction"), // e.g. "SW", "SSW"

  // Wind data
  windSpeed: real("wind_speed"), // km/h
  windDirection: text("wind_direction"), // e.g. "NW", "SE"
  windState: text("wind_state"), // e.g. "offshore", "onshore", "cross-shore", "glassy"

  // Ratings
  rating: real("rating"), // source-specific rating (0-10 for surf-forecast)
  conditionText: text("condition_text"), // e.g. "FAIR TO GOOD", "POOR"

  // Tide
  highTideTime: text("high_tide_time"),
  highTideHeight: real("high_tide_height"),
  lowTideTime: text("low_tide_time"),
  lowTideHeight: real("low_tide_height"),

  // Extra
  waterTemp: real("water_temp"), // °C
  sunrise: text("sunrise"),
  sunset: text("sunset"),
  rawData: text("raw_data"), // JSON — full scraped payload for debugging

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * Notification log — tracks what was sent and when.
 */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scrapeRunId: integer("scrape_run_id")
    .notNull()
    .references(() => scrapeRuns.id),
  channel: text("channel").notNull(), // "telegram"
  target: text("target").notNull(), // chat/thread ID
  message: text("message").notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})
