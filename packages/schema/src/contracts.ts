export const SESSION_WINDOWS = ["morning", "afternoon"] as const

export type SessionWindow = (typeof SESSION_WINDOWS)[number]

export type SpotRecord = {
  slug: string
  name: string
  description: string | null
  idealMinHeight: number | null
  idealMaxHeight: number | null
  offshoreWindDirs: string[]
  sourceUrls: Record<string, string>
  notes: string | null
}

export type SpotSourceForecast = {
  source: string
  sourceUrl: string | null
  waveHeightMin: number | null
  waveHeightMax: number | null
  wavePeriod: number | null
  swellDirection: string | null
  windSpeed: number | null
  windDirection: string | null
  windState: string | null
  rating: number | null
  conditionText: string | null
  highTideTime: string | null
  highTideHeight: number | null
  lowTideTime: string | null
  lowTideHeight: number | null
  waterTemp: number | null
  sunrise: string | null
  sunset: string | null
}

export type SpotOverview = {
  bestRating: number | null
  ratingBand: "good" | "fair" | "poor" | "unknown"
  consensusWaveHeightMin: number | null
  consensusWaveHeightMax: number | null
  windState: string | null
  windEmoji: string
  bestSessionWindow: SessionWindow | null
  bestSource: string | null
  score: number
}

export type SpotSummary = {
  spot: SpotRecord
  overview: SpotOverview
  sources: Record<string, SpotSourceForecast>
}

export type ForecastSummaryResponse = {
  date: string
  runId: number | null
  generatedAt: string | null
  spots: SpotSummary[]
}
