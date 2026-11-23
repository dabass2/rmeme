import { OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types";

/**
 * Creates a router whose request validation failures return the same
 * `{ message }` error shape as the rest of the API.
 */
export function createRouter() {
  return new OpenAPIHono<AppEnv>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        const message = result.error.issues
          .map((issue) =>
            issue.path.length
              ? `${issue.path.join(".")}: ${issue.message}`
              : issue.message,
          )
          .join("; ");
        return c.json({ message }, 400);
      }
    },
  });
}

export const MessageSchema = z
  .object({ message: z.string() })
  .openapi("Message");

export const jsonMessage = (description: string) => ({
  description,
  content: { "application/json": { schema: MessageSchema } },
});
