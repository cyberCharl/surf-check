import { z } from "zod"

// ─── Spots ───

export const spotSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  idealMinHeight: z.number().optional(),
  idealMaxHeight: z.number().optional(),
  offshoreWindDirs: z.array(z.string()).optional(),
  sourceUrls: z.record(z.string()).optional(),
  notes: z.string().optional(),
})

export type SpotInput = z.infer<typeof spotSchema>

// ─── Scrape Runs ───

export const createScrapeRunSchema = z.object({
  forecastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["complete", "partial", "failed"]).default("complete"),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateScrapeRunInput = z.infer<typeof createScrapeRunSchema>

// ─── Forecasts ───

export const forecastSchema = z.object({
  scrapeRunId: z.number().int().positive(),
  spotSlug: z.string().min(1), // resolved to spotId server-side
  source: z.string().min(1),
  forecastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  waveHeightMin: z.number().optional(),
  waveHeightMax: z.number().optional(),
  wavePeriod: z.number().optional(),
  swellDirection: z.string().optional(),

  windSpeed: z.number().optional(),
  windDirection: z.string().optional(),
  windState: z.string().optional(),

  rating: z.number().min(0).max(10).optional(),
  conditionText: z.string().optional(),

  highTideTime: z.string().optional(),
  highTideHeight: z.number().optional(),
  lowTideTime: z.string().optional(),
  lowTideHeight: z.number().optional(),

  waterTemp: z.number().optional(),
  sunrise: z.string().optional(),
  sunset: z.string().optional(),

  rawData: z.record(z.unknown()).optional(),
})

export type ForecastInput = z.infer<typeof forecastSchema>

// ─── Batch ingest (CLI → API) ───

export const ingestPayloadSchema = z.object({
  forecastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["complete", "partial", "failed"]).default("complete"),
  forecasts: z.array(forecastSchema.omit({ scrapeRunId: true, forecastDate: true })),
})

export type IngestPayload = z.infer<typeof ingestPayloadSchema>

// ─── Query params ───

export const forecastQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  spot: z.string().optional(),
  source: z.string().optional(),
  limit: z.coerce.number().int().positive().default(50),
})

export type ForecastQuery = z.infer<typeof forecastQuerySchema>
