import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { db } from "../db";
import { users } from "../db/schema/users";
import type { AppEnv } from "../types";

/** `YYYY-MM-DD` in UTC. Handles SQLite's `datetime('now')` format as UTC. */
function utcDay(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const normalized = /[zZ]|[+-]\d\d:?\d\d$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export const auth = createMiddleware<AppEnv>(async (c, next) => {
  const apiKey = c.req.header("x-api-key");
  if (!apiKey) return c.json({ message: "Unauthorized" }, 401);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKey, apiKey))
    .limit(1);

  if (!user) return c.json({ message: "Unauthorized" }, 401);

  const now = new Date();
  const sameDay = utcDay(user.lastAccessed) === utcDay(now);

  if (sameDay && user.accesses >= user.dailyLimit) {
    return c.json({ message: "Daily request limit reached" }, 429);
  }

  c.set("user", user);

  await next();

  const accesses = sameDay ? user.accesses + 1 : 1;
  await db
    .update(users)
    .set({ accesses, lastAccessed: now.toISOString() })
    .where(eq(users.user_id, user.user_id));

  console.log(
    `User ${user.user_id} has made a request. Total accesses today: ${accesses}/${user.dailyLimit}`,
  );

  c.header("x-rate-limit", String(Math.max(user.dailyLimit - accesses, 0)));
});
