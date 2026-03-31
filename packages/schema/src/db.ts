import { drizzle } from "drizzle-orm/bun-sqlite"
import { join } from "node:path"
import { homedir } from "node:os"
import { mkdirSync } from "node:fs"
import * as schema from "./tables"

const dataDir = join(homedir(), ".local/share/dawn-patrol")
mkdirSync(dataDir, { recursive: true })

const dbPath = join(dataDir, "dawn-patrol.db")

export const db = drizzle({ connection: dbPath, schema })
export type Database = typeof db
