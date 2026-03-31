import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import { db } from "@workspace/schema/db"
import { spots as spotsTable } from "@workspace/schema/tables"
import { spotSchema } from "@workspace/schema/validators"
import type { SpotRecord } from "@workspace/schema/contracts"
import { eq } from "drizzle-orm"

export const spots = new Hono()

function serializeSpot(row: typeof spotsTable.$inferSelect): SpotRecord {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
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
}

// List all spots
spots.get("/", async (c) => {
  const rows = await db.select().from(spotsTable)
  return c.json(rows.map(serializeSpot))
})

// Get spot by slug
spots.get("/:slug", async (c) => {
  const slug = c.req.param("slug")
  const rows = await db.select().from(spotsTable).where(eq(spotsTable.slug, slug))
  if (!rows.length) return c.json({ error: "Spot not found" }, 404)
  return c.json(serializeSpot(rows[0]))
})

// Create or update spot (upsert by slug)
spots.put("/", zValidator("json", spotSchema), async (c) => {
  const input = c.req.valid("json")
  const existing = await db.select().from(spotsTable).where(eq(spotsTable.slug, input.slug))

  if (existing.length) {
    await db
      .update(spotsTable)
      .set({
        name: input.name,
        description: input.description,
        idealMinHeight: input.idealMinHeight,
        idealMaxHeight: input.idealMaxHeight,
        offshoreWindDirs: input.offshoreWindDirs
          ? JSON.stringify(input.offshoreWindDirs)
          : null,
        sourceUrls: input.sourceUrls
          ? JSON.stringify(input.sourceUrls)
          : null,
        notes: input.notes,
      })
      .where(eq(spotsTable.slug, input.slug))
    return c.json({ status: "updated", slug: input.slug })
  }

  await db.insert(spotsTable).values({
    slug: input.slug,
    name: input.name,
    description: input.description,
    idealMinHeight: input.idealMinHeight,
    idealMaxHeight: input.idealMaxHeight,
    offshoreWindDirs: input.offshoreWindDirs
      ? JSON.stringify(input.offshoreWindDirs)
      : null,
    sourceUrls: input.sourceUrls
      ? JSON.stringify(input.sourceUrls)
      : null,
    notes: input.notes,
  })
  return c.json({ status: "created", slug: input.slug }, 201)
})
