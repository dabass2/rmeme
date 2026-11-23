import { Hono } from "hono";

export const healthRouter = new Hono().get("/", (c) => c.text("APP UP"));
