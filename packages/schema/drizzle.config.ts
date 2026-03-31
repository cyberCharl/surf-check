import { defineConfig } from "drizzle-kit"
import { join } from "node:path"
import { homedir } from "node:os"

export default defineConfig({
  schema: "./src/tables.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: join(homedir(), ".local/share/dawn-patrol/dawn-patrol.db"),
  },
})
