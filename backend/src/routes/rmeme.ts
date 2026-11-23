import { createRoute, z } from "@hono/zod-openapi";
import { count, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { meme_tags } from "../db/schema/meme_tags";
import { memes } from "../db/schema/memes";
import { memeUrl } from "../lib/meme";
import { createRouter, jsonMessage } from "../lib/router";

const RandomMemeSchema = z
  .object({
    meme_id: z.number().int(),
    filename: z.string(),
    extension: z.string(),
    format: z.string(),
    score: z.number().int(),
    tags: z.string().nullable(),
    url: z.string(),
  })
  .openapi("RandomMeme");

const getRandomMeme = createRoute({
  method: "get",
  path: "/",
  tags: ["rmeme"],
  summary: "Get a random meme",
  responses: {
    200: {
      description: "success",
      content: { "application/json": { schema: RandomMemeSchema } },
    },
    500: jsonMessage("server error"),
  },
});

const getTotalMemes = createRoute({
  method: "get",
  path: "/total",
  tags: ["rmeme"],
  summary: "Get total amount of memes",
  responses: {
    200: {
      description: "success",
      content: {
        "application/json": {
          schema: z.object({ total: z.number().int() }),
        },
      },
    },
    500: jsonMessage("server error"),
  },
});

export const rmemeRouter = createRouter()
  .openapi(getRandomMeme, async (c) => {
    // tHIs isNT pERfoRMAnT
    const [meme] = await db
      .select({
        meme_id: memes.meme_id,
        filename: memes.filename,
        extension: memes.extension,
        format: memes.format,
        score: memes.score,
        tags: sql<string | null>`(select GROUP_CONCAT(${
          meme_tags.tag
        }) from ${meme_tags} where ${eq(meme_tags.meme_id, memes.meme_id)})`,
      })
      .from(memes)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!meme) return c.json({ message: "Failed to get random meme" }, 500);

    return c.json({ ...meme, url: memeUrl(meme.filename, meme.extension) }, 200);
  })
  .openapi(getTotalMemes, async (c) => {
    const [result] = await db.select({ value: count() }).from(memes);

    if (!result) {
      return c.json({ message: "Failed to get total number of memes" }, 500);
    }

    return c.json({ total: result.value }, 200);
  });
