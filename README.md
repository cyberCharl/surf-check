# 🌅 Dawn Patrol

Multi-spot, multi-source surf forecast aggregator with evening notifications. Replaces Surfline's single-spot free-tier alerts with a richer, self-hosted alternative.

## How it works

1. **Cron scrapes** forecast data from multiple sources (surf-forecast.com, Surfline, Windguru, Windy) for configured surf spots
2. **CLI ingests** scraped data into a local SQLite database via the API
3. **Web app** shows tomorrow's forecast overview — per-spot conditions with source-by-source comparison
4. **Notification** sends a brief nudge to Telegram when conditions are worth paddling out, with a link to the detail view

## Architecture

```
dawn-patrol/
  apps/
    web/            # Vite + React + shadcn/ui — forecast dashboard
  packages/
    schema/         # Drizzle ORM schema + Zod validators (single source of truth)
    api/            # Hono server — serves DB over typed endpoints
    cli/            # Commander CLI — used by agents to ingest forecast data
    ui/             # Shared shadcn/ui components
  skills/
    surf-fetch/     # SKILL.md — how to scrape forecast data from sources
    surf-cli/       # SKILL.md — how to use the CLI to write/read data
  drizzle/          # Generated migrations
```

### Type-safety chain

`packages/schema` defines Drizzle tables and Zod request/response schemas. The API, CLI, and web app all import from schema — a schema change produces type errors across every consumer at build time.

## Stack

- **Runtime:** [Bun](https://bun.sh)
- **Monorepo:** [Turborepo](https://turbo.build) + Bun workspaces
- **Database:** SQLite via [Drizzle ORM](https://orm.drizzle.team)
- **API:** [Hono](https://hono.dev)
- **Web:** [Vite](https://vite.dev) + [React](https://react.dev) + [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **CLI:** [Commander](https://github.com/tj/commander.js)
- **Validation:** [Zod](https://zod.dev)

## Development

```bash
# Install dependencies
bun install

# Run all apps in dev mode
bun dev

# Build everything
bun run build

# Type check
bun run typecheck
```

## Configuration

Surf spot configuration lives at `~/.config/dawn-patrol/config.json` (XDG-compliant). See `skills/surf-fetch/SKILL.md` for the config schema.

## License

[MIT](LICENSE)
