import { Hono } from "hono"
import { db } from "@workspace/schema/db"
import {
  forecasts as forecastsTable,
  scrapeRuns,
  spots as spotsTable,
} from "@workspace/schema/tables"
import { buildSpotOverview } from "@workspace/schema/summary"
import type {
  ForecastSummaryResponse,
  SpotRecord,
  SpotSourceForecast,
  SpotSummary,
} from "@workspace/schema/contracts"
import { and, desc, eq, type SQL } from "drizzle-orm"

export const forecasts = new Hono()

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDateOrTomorrow(value?: string | null) {
  if (value && DATE_PATTERN.test(value)) {
    return value
  }

  return new Date(Date.now() + 86400000).toISOString().split("T")[0]
}

async function getLatestRun(targetDate: string) {
  const [latestRun] = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.forecastDate, targetDate))
    .orderBy(desc(scrapeRuns.scrapedAt), desc(scrapeRuns.id))
    .limit(1)

  return latestRun ?? null
}

// Get forecasts — optionally filter by date, spot, source
forecasts.get("/", async (c) => {
  const date = c.req.query("date")
  const spot = c.req.query("spot")
  const source = c.req.query("source")
  const limit = parseInt(c.req.query("limit") ?? "50")
  const latestOnly = ["1", "true", "yes"].includes(
    c.req.query("latest")?.toLowerCase() ?? ""
  )

  const conditions: SQL[] = []
  if (date) conditions.push(eq(forecastsTable.forecastDate, date))
  if (source) conditions.push(eq(forecastsTable.source, source))
  if (spot) conditions.push(eq(spotsTable.slug, spot))

  if (latestOnly) {
    const targetDate = parseDateOrTomorrow(date)
    const latestRun = await getLatestRun(targetDate)
    if (!latestRun) {
      return c.json([])
    }

    conditions.push(eq(forecastsTable.scrapeRunId, latestRun.id))
  }

  let query = db
    .select({
      id: forecastsTable.id,
      scrapeRunId: forecastsTable.scrapeRunId,
      spotSlug: spotsTable.slug,
      spotName: spotsTable.name,
      source: forecastsTable.source,
      forecastDate: forecastsTable.forecastDate,
      waveHeightMin: forecastsTable.waveHeightMin,
      waveHeightMax: forecastsTable.waveHeightMax,
      wavePeriod: forecastsTable.wavePeriod,
      swellDirection: forecastsTable.swellDirection,
      windSpeed: forecastsTable.windSpeed,
      windDirection: forecastsTable.windDirection,
      windState: forecastsTable.windState,
      rating: forecastsTable.rating,
      conditionText: forecastsTable.conditionText,
      highTideTime: forecastsTable.highTideTime,
      highTideHeight: forecastsTable.highTideHeight,
      lowTideTime: forecastsTable.lowTideTime,
      lowTideHeight: forecastsTable.lowTideHeight,
      waterTemp: forecastsTable.waterTemp,
      sunrise: forecastsTable.sunrise,
      sunset: forecastsTable.sunset,
      createdAt: forecastsTable.createdAt,
    })
    .from(forecastsTable)
    .innerJoin(spotsTable, eq(forecastsTable.spotId, spotsTable.id))

  if (conditions.length) {
    query = query.where(and(...conditions)) as typeof query
  }

  const rows = await query.orderBy(desc(forecastsTable.createdAt)).limit(limit)
  return c.json(rows)
})

// Get latest forecast summary for tomorrow (or a given date)
forecasts.get("/summary", async (c) => {
  const targetDate = parseDateOrTomorrow(c.req.query("date"))
  const spot = c.req.query("spot")
  const latestRun = await getLatestRun(targetDate)

  if (!latestRun) {
    const emptyResponse: ForecastSummaryResponse = {
      date: targetDate,
      runId: null,
      generatedAt: null,
      spots: [],
    }

    return c.json(emptyResponse)
  }

  const conditions: SQL[] = [eq(forecastsTable.scrapeRunId, latestRun.id)]
  if (spot) {
    conditions.push(eq(spotsTable.slug, spot))
  }

  const allForecasts = await db
    .select({
      spotSlug: spotsTable.slug,
      spotName: spotsTable.name,
      spotDescription: spotsTable.description,
      idealMinHeight: spotsTable.idealMinHeight,
      idealMaxHeight: spotsTable.idealMaxHeight,
      offshoreWindDirs: spotsTable.offshoreWindDirs,
      sourceUrls: spotsTable.sourceUrls,
      notes: spotsTable.notes,
      source: forecastsTable.source,
      waveHeightMin: forecastsTable.waveHeightMin,
      waveHeightMax: forecastsTable.waveHeightMax,
      wavePeriod: forecastsTable.wavePeriod,
      swellDirection: forecastsTable.swellDirection,
      windSpeed: forecastsTable.windSpeed,
      windDirection: forecastsTable.windDirection,
      windState: forecastsTable.windState,
      rating: forecastsTable.rating,
      conditionText: forecastsTable.conditionText,
      highTideTime: forecastsTable.highTideTime,
      highTideHeight: forecastsTable.highTideHeight,
      lowTideTime: forecastsTable.lowTideTime,
      lowTideHeight: forecastsTable.lowTideHeight,
      waterTemp: forecastsTable.waterTemp,
      sunrise: forecastsTable.sunrise,
      sunset: forecastsTable.sunset,
    })
    .from(forecastsTable)
    .innerJoin(spotsTable, eq(forecastsTable.spotId, spotsTable.id))
    .where(and(...conditions))
    .orderBy(spotsTable.slug, forecastsTable.source)

  const bySpot: Record<string, SpotSummary> = {}
  for (const row of allForecasts) {
    if (!bySpot[row.spotSlug]) {
      const spotRecord: SpotRecord = {
        slug: row.spotSlug,
        name: row.spotName,
        description: row.spotDescription,
        idealMinHeight: row.idealMinHeight,
        idealMaxHeight: row.idealMaxHeight,
        offshoreWindDirs: row.offshoreWindDirs
          ? (JSON.parse(row.offshoreWindDirs) as string[])
          : [],
        sourceUrls: row.sourceUrls
          ? (JSON.parse(row.sourceUrls) as Record<string, string>)
          : {},
        notes: row.notes,
      }

      bySpot[row.spotSlug] = {
        spot: spotRecord,
        overview: buildSpotOverview({}, spotRecord),
        sources: {},
      }
    }

    const spotSourceUrls = bySpot[row.spotSlug].spot.sourceUrls
    const sourceForecast: SpotSourceForecast = {
      source: row.source,
      sourceUrl: spotSourceUrls[row.source] ?? null,
      waveHeightMin: row.waveHeightMin,
      waveHeightMax: row.waveHeightMax,
      wavePeriod: row.wavePeriod,
      swellDirection: row.swellDirection,
      windSpeed: row.windSpeed,
      windDirection: row.windDirection,
      windState: row.windState,
      rating: row.rating,
      conditionText: row.conditionText,
      highTideTime: row.highTideTime,
      highTideHeight: row.highTideHeight,
      lowTideTime: row.lowTideTime,
      lowTideHeight: row.lowTideHeight,
      waterTemp: row.waterTemp,
      sunrise: row.sunrise,
      sunset: row.sunset,
    }

    bySpot[row.spotSlug].sources[row.source] = sourceForecast
    bySpot[row.spotSlug].overview = buildSpotOverview(
      bySpot[row.spotSlug].sources,
      bySpot[row.spotSlug].spot
    )
  }

  const response: ForecastSummaryResponse = {
    date: targetDate,
    runId: latestRun.id,
    generatedAt: latestRun.scrapedAt.toISOString(),
    spots: Object.values(bySpot).sort((left, right) => {
      if (right.overview.score !== left.overview.score) {
        return right.overview.score - left.overview.score
      }

      return left.spot.name.localeCompare(right.spot.name)
    }),
  }

  return c.json(response)
})
