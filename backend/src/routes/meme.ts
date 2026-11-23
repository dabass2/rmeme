import { createRoute, z } from "@hono/zod-openapi";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { desc, eq, sql } from "drizzle-orm";
import { config } from "../config";
import { db } from "../db";
import { meme_tags } from "../db/schema/meme_tags";
import { memes } from "../db/schema/memes";
import { memeUrl } from "../lib/meme";
import { createRouter, jsonMessage } from "../lib/router";

const FORMATS: Record<string, "image" | "video" | "gif"> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  apng: "image",
  webp: "image",
  mp4: "video",
  webm: "video",
  mov: "video",
  gif: "gif",
};

const MemeSchema = z
  .object({
    meme_id: z.number().int(),
    filename: z.string(),
    extension: z.string(),
    format: z.string(),
    uploadedBy: z.number().int().nullable(),
    score: z.number().int(),
    url: z.string(),
  })
  .openapi("Meme");

const IdParamSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .openapi({
      param: { name: "id", in: "path" },
      description: "ID of the meme. Negative values count back from the newest meme.",
      example: 1,
    }),
});

const security = [{ ApiKey: [] }];
const authResponses = {
  401: jsonMessage("missing or invalid API key"),
  429: jsonMessage("daily request limit reached"),
};

const uploadMeme = createRoute({
  method: "post",
  path: "/",
  tags: ["meme"],
  summary: "Uploads a new meme",
  security,
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            url: z.url().openapi({ description: "URL of the file to upload" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "success",
      content: { "application/json": { schema: MemeSchema } },
    },
    400: jsonMessage("bad request"),
    500: jsonMessage("server error"),
    ...authResponses,
  },
});

const getMeme = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["meme"],
  summary: "Gets a specific meme by ID",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "success",
      content: { "application/json": { schema: MemeSchema } },
    },
    400: jsonMessage("bad request"),
    404: jsonMessage("meme not found"),
  },
});

const updateMeme = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["meme"],
  summary: "Updates a meme by id",
  security,
  request: {
    params: IdParamSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            votes: z
              .number()
              .int()
              .openapi({ description: "The votes to apply to the meme" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "success",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            meme_id: z.number().int(),
            score: z.number().int(),
          }),
        },
      },
    },
    400: jsonMessage("bad request"),
    404: jsonMessage("meme not found"),
    ...authResponses,
  },
});

const deleteMeme = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["meme"],
  summary: "Deletes a meme by id",
  security,
  request: { params: IdParamSchema },
  responses: {
    200: jsonMessage("success"),
    400: jsonMessage("bad request"),
    404: jsonMessage("meme not found"),
    ...authResponses,
  },
});

export const memeRouter = createRouter()
  .openapi(uploadMeme, async (c) => {
    const { url } = c.req.valid("json");

    const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
    if (!extension || extension.includes("/")) {
      return c.json(
        { message: `Failed to get extension of file from url: ${url}` },
        400,
      );
    }

    const format = FORMATS[extension];
    if (!format) {
      return c.json(
        { message: `Unallowed file format '${extension}' provided` },
        400,
      );
    }

    const fileResponse = await fetch(url).catch(() => null);
    if (!fileResponse?.ok) {
      return c.json(
        {
          message: `Failed to download file from url: ${url}`,
        },
        400,
      );
    }

    const filename = randomUUID();
    await writeFile(
      `${config.fileStoreBasePath}/${filename}.${extension}`,
      Buffer.from(await fileResponse.arrayBuffer()),
    );

    const newMeme = {
      filename,
      extension,
      format,
      uploadedBy: c.var.user.user_id,
      score: 0,
    } satisfies typeof memes.$inferInsert;

    const [inserted] = await db.insert(memes).values(newMeme).returning();
    if (!inserted) {
      return c.json({ message: "Error when uploading meme" }, 500);
    }

    return c.json(
      { ...inserted, url: memeUrl(inserted.filename, inserted.extension) },
      200,
    );
  })
  .openapi(getMeme, async (c) => {
    let { id } = c.req.valid("param");

    if (id < 0) {
      const [latest] = await db
        .select({ max_id: memes.meme_id })
        .from(memes)
        .orderBy(desc(memes.meme_id))
        .limit(1);

      if (!latest) return c.json({ message: "No memes found." }, 404);
      id = latest.max_id + id;
    }

    const [meme] = await db.select().from(memes).where(eq(memes.meme_id, id));

    if (!meme) return c.json({ message: `No meme with id ${id} found.` }, 404);

    return c.json({ ...meme, url: memeUrl(meme.filename, meme.extension) }, 200);
  })
  .openapi(updateMeme, async (c) => {
    const { id } = c.req.valid("param");
    const { votes } = c.req.valid("json");

    const [updated] = await db
      .update(memes)
      .set({ score: sql`${memes.score} + ${votes}` })
      .where(eq(memes.meme_id, id))
      .returning({ meme_id: memes.meme_id, score: memes.score });

    if (!updated) return c.json({ message: `No meme with id ${id} found.` }, 404);

    return c.json(
      {
        message: `Updated score for meme ${id}`,
        meme_id: updated.meme_id,
        score: updated.score,
      },
      200,
    );
  })
  .openapi(deleteMeme, async (c) => {
    const { id } = c.req.valid("param");

    const result = await db.transaction(async (tx) => {
      await tx.delete(meme_tags).where(eq(meme_tags.meme_id, id));
      return tx.delete(memes).where(eq(memes.meme_id, id));
    });

    if (!result.rowsAffected) {
      return c.json({ message: `No meme with id ${id} found.` }, 404);
    }

    return c.json({ message: `Deleted meme with id: ${id}` }, 200);
  });
