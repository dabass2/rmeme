import type { users } from "./db/schema/users";

export type User = typeof users.$inferSelect;

export type AppEnv = {
  Variables: {
    user: User;
  };
};
