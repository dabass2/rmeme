import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { auth } from "./middleware/auth";
import { healthRouter } from "./routes/health";
import { memeRouter } from "./routes/meme";
import { rmemeRouter } from "./routes/rmeme";
import type { AppEnv } from "./types";

export const app = new OpenAPIHono<AppEnv>({ strict: false });

app.use(logger());
app.use(cors());

app.route("/health", healthRouter);
app.route("/rmeme", rmemeRouter);

app.use("/meme/*", auth);
app.route("/meme", memeRouter);

app.openAPIRegistry.registerComponent("securitySchemes", "ApiKey", {
  type: "apiKey",
  in: "header",
  name: "x-api-key",
});

app.doc31("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "rmeme",
    version: "3.0.0",
    description: "API for getting a random meme",
  },
});
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

app.notFound((c) => c.json({ message: "Not found" }, 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  console.error(err);
  return c.json({ message: "Internal server error" }, 500);
});
