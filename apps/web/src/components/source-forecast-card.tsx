import type { SpotSourceForecast } from "@workspace/schema/contracts"
import {
  formatDirection,
  formatHeightRange,
  formatNumber,
  formatRating,
  formatWindSummary,
  getSourceLabel,
} from "@/lib/format"

type SourceForecastCardProps = {
  forecast: SpotSourceForecast
}

export function SourceForecastCard({ forecast }: SourceForecastCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_50px_rgba(2,8,18,0.28)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
            Source
          </div>
          <h2 className="mt-2 text-lg font-semibold text-white">
            {forecast.sourceUrl ? (
              <a
                href={forecast.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-cyan-400/40 underline-offset-2 transition-colors hover:text-cyan-200 hover:decoration-cyan-300"
              >
                {getSourceLabel(forecast.source)}
              </a>
            ) : (
              getSourceLabel(forecast.source)
            )}
          </h2>
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-slate-100">
          {formatRating(forecast.rating)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Wave height" value={formatHeightRange(forecast.waveHeightMin, forecast.waveHeightMax)} />
        <Metric label="Period" value={formatNumber(forecast.wavePeriod, " s", 0)} />
        <Metric label="Swell" value={formatDirection(forecast.swellDirection)} />
        <Metric label="Wind" value={formatWindSummary(forecast)} />
        <Metric label="High tide" value={buildTideLabel(forecast.highTideTime, forecast.highTideHeight)} />
        <Metric label="Low tide" value={buildTideLabel(forecast.lowTideTime, forecast.lowTideHeight)} />
        <Metric label="Water temp" value={formatNumber(forecast.waterTemp, "°C", 0)} />
        <Metric label="Sun" value={buildSunLabel(forecast.sunrise, forecast.sunset)} />
      </div>

      <div className="mt-4 rounded-2xl bg-black/20 p-3 text-sm leading-6 text-slate-300">
        <div className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
          Conditions
        </div>
        <p className="mt-2">{forecast.conditionText ?? "No condition note available."}</p>
      </div>
    </article>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/20 p-3">
      <div className="text-[0.68rem] uppercase tracking-[0.2em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 font-medium text-white">{value}</div>
    </div>
  )
}

function buildTideLabel(time: string | null, height: number | null) {
  if (!time && height == null) {
    return "—"
  }

  const heightLabel = height == null ? "" : ` @ ${height.toFixed(1)} m`
  return `${time ?? "—"}${heightLabel}`
}

function buildSunLabel(sunrise: string | null, sunset: string | null) {
  if (!sunrise && !sunset) {
    return "—"
  }

  return `${sunrise ?? "—"} / ${sunset ?? "—"}`
}
