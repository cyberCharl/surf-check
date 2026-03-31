import { Command } from "commander"
import type { SpotRecord } from "@workspace/schema/contracts"
import type { SpotInput } from "@workspace/schema/validators"

export function spotsCmd(apiUrl: string) {
  const cmd = new Command("spots").description("Manage surf spots")

  cmd
    .command("list")
    .description("List all configured spots")
    .action(async () => {
      const res = await fetch(`${apiUrl}/api/spots`)
      if (!res.ok) {
        console.error(`Error ${res.status}: ${await res.text()}`)
        process.exit(1)
      }

      const spots = (await res.json()) as SpotRecord[]
      if (!spots.length) {
        console.log("No spots configured. Use 'spots sync' to populate from config.")
        return
      }
      for (const s of spots) {
        console.log(`  ${s.slug} — ${s.name} (${s.description ?? "no description"})`)
      }
    })

  cmd
    .command("sync")
    .description("Sync spots from config file to database")
    .option("-c, --config <path>", "Config file path", `${process.env.HOME}/.config/surf-check/config.json`)
    .action(async (opts) => {
      const config = JSON.parse(await Bun.file(opts.config).text())
      if (!Array.isArray(config.spots)) {
        console.error("Config file is missing a valid 'spots' array.")
        process.exit(1)
      }

      for (const spot of config.spots) {
        const slug = spot.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
        const payload: SpotInput = {
          slug,
          name: spot.name,
          description: spot.description,
          idealMinHeight: spot.ideal?.minHeight_m,
          idealMaxHeight: spot.ideal?.maxHeight_m,
          offshoreWindDirs: spot.ideal?.offshoreWindDir,
          sourceUrls: spot.sources,
          notes: spot.ideal?.notes,
        }

        const res = await fetch(`${apiUrl}/api/spots`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          const result = await res.json()
          console.log(`  ${result.status}: ${slug}`)
        } else {
          console.error(`  Failed ${slug}: ${await res.text()}`)
          process.exitCode = 1
        }
      }
    })

  return cmd
}
