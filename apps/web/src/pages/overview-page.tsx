import { useEffect, useState } from "react"
import type { ForecastSummaryResponse } from "@workspace/schema/contracts"
import { AppShell } from "@/components/app-shell"
import { SpotCard } from "@/components/spot-card"
import { StatePanel } from "@/components/state-panel"
import { fetchForecastSummary, getTomorrowDate } from "@/lib/api"

type LoadState = {
  data: ForecastSummaryResponse | null
  error: string | null
  loading: boolean
}

export function OverviewPage() {
  const [state, setState] = useState<LoadState>({
    data: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const data = await fetchForecastSummary({
          date: getTomorrowDate(),
          signal: controller.signal,
        })
        setState({ data, error: null, loading: false })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setState({
          data: null,
          error: error instanceof Error ? error.message : "Unable to load forecast data.",
          loading: false,
        })
      }
    })()

    return () => {
      controller.abort()
    }
  }, [])

  const bestBet = state.data?.spots[0] ?? null
  const otherSpots = state.data?.spots.slice(1) ?? []
  const forecastDate = state.data?.date ?? getTomorrowDate()

  return (
    <AppShell
      eyebrow="Dawn Patrol"
      title="Tomorrow at a glance"
      subtitle="A multi-source Cape Town read on where the cleanest window is lining up."
      meta={state.data ? `Forecast date ${state.data.date}` : undefined}
    >
      {state.loading ? (
        <LoadingBlocks />
      ) : state.error ? (
        <StatePanel
          title="Forecast feed unavailable"
          body={`${state.error} Check that the API is running on port 3220.`}
        />
      ) : !state.data?.spots.length ? (
        <StatePanel
          title="No forecast data yet"
          body="Sync your spots, ingest tomorrow's sample forecasts, and this overview will light up."
        />
      ) : (
        <div className="space-y-5">
          {bestBet ? <SpotCard date={forecastDate} featured spot={bestBet} /> : null}

          <section className="grid gap-4">
            {otherSpots.map((spot) => (
              <SpotCard key={spot.spot.slug} date={forecastDate} spot={spot} />
            ))}
          </section>
        </div>
      )}
    </AppShell>
  )
}

function LoadingBlocks() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-[1.75rem] border border-white/10 bg-white/5"
        />
      ))}
    </div>
  )
}
