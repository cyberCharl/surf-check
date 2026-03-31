import { Hono } from "hono"
import { cors } from "hono/cors"
import { spots } from "./routes/spots"
import { forecasts } from "./routes/forecasts"
import { ingest } from "./routes/ingest"
import { runs } from "./routes/runs"

const app = new Hono()

app.use("/*", cors())

app.route("/api/spots", spots)
app.route("/api/forecasts", forecasts)
app.route("/api/ingest", ingest)
app.route("/api/runs", runs)

app.get("/api/health", (c) => c.json({ status: "ok" }))

const port = parseInt(process.env.DAWN_PATROL_PORT ?? "3220")

console.log(`🏄 Dawn Patrol API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
