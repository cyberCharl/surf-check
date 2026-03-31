# Surf Fetch — Data Collection Skill 🏄

Scrapes surf forecast data from multiple sources for configured spots. Used by the cron job to populate the Dawn Patrol database.

## Config

Read spot configuration from `~/.config/dawn-patrol/config.json`. Each spot has a `sources` map of source name → forecast URL.

## Workflow

### 1. Load Config
Read `~/.config/dawn-patrol/config.json` to get the list of spots and their source URLs.

### 2. Scrape Each Source

For each spot, scrape **tomorrow's** forecast from each configured source:

#### surf-forecast.com (PRIMARY)
- **Method:** `web_fetch` on the spot's `surf-forecast` URL
- **Extracts:** wave height (m), period (s), swell direction, wind direction, wind state, surf rating (0-10), tide times, water temp, sunrise/sunset
- Most structured source — rating, energy, wind state are all in the page HTML
- Look at the **tomorrow** columns (second day in the 48hr forecast table)

#### surfline.com
- **Method:** Browser automation (`browser` tool, `profile=openclaw`, `target=host`)
- Surfline blocks non-browser requests (returns 403)
- **Extracts:** wave height range (ft → convert to m), conditions text (POOR/FAIR/GOOD/EPIC)
- Snapshot the page and extract the forecast summary

#### windguru.cz
- **Method:** Browser automation (JS-heavy rendering)
- **Extracts:** wave height, wind speed/direction, wave period
- Look at tomorrow's forecast columns in the table

#### windy.com
- **Method:** Optional/supplementary, browser if needed
- Use for cross-referencing when other sources conflict

### 3. Structure Output

Produce a JSON payload matching the ingest schema:

```json
{
  "forecastDate": "2026-04-01",
  "status": "complete",
  "forecasts": [
    {
      "spotSlug": "muizenberg",
      "source": "surf-forecast",
      "waveHeightMin": 0.6,
      "waveHeightMax": 1.2,
      "wavePeriod": 12,
      "swellDirection": "SW",
      "windSpeed": 10,
      "windDirection": "NW",
      "windState": "offshore",
      "rating": 4,
      "conditionText": null,
      "highTideTime": "06:30",
      "highTideHeight": 1.55,
      "lowTideTime": "12:45",
      "lowTideHeight": 0.10,
      "waterTemp": 18,
      "sunrise": "06:56",
      "sunset": "18:40"
    }
  ]
}
```

### 4. Ingest via CLI

Pipe the JSON to the CLI:

```bash
echo '<json>' | bun /path/to/dawn-patrol/packages/cli/src/index.ts ingest
```

Or save to a temp file and use:

```bash
bun /path/to/dawn-patrol/packages/cli/src/index.ts ingest -f /tmp/forecast.json
```

### 5. Assess & Notify

After ingesting, query the summary:

```bash
bun /path/to/dawn-patrol/packages/cli/src/index.ts query summary
```

If any spot has a rating ≥ 3 (from surf-forecast.com) or conditions "FAIR" or better (from Surfline), send a nudge notification to Telegram:

```
🏄 Long Beach looking good tomorrow — 1.2-1.8m SW, clean offshores all day
→ http://<odyssey-core-tailscale-ip>:3220
```

Keep the nudge to 1-2 lines max. Link to the web UI for details.

## Spot Slug Convention

Slugs are derived from spot names: lowercase, non-alphanumeric replaced with hyphens.
- "Muizenberg" → `muizenberg`
- "Llandudno" → `llandudno`
- "Long Beach (Kommetjie)" → `long-beach--kommetjie` or `long-beach-kommetjie`

## Notes

- Always sync spots to DB before first ingest: `bun cli spots sync`
- surf-forecast.com is the anchor source — its 0-10 rating drives notification decisions
- Convert Surfline feet to metres (÷ 3.281)
- If a source fails to scrape, still ingest what you got — set run status to "partial"
