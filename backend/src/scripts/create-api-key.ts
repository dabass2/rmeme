import { randomBytes } from "node:crypto";
import { db } from "../db";
import { users } from "../db/schema/users";

/**
 * Creates an API user and prints its key.
 *
 *   node dist/scripts/create-api-key.js <name> [dailyLimit]
 */
async function main() {
  const [name, limitArg = "1000"] = process.argv.slice(2);
  const dailyLimit = Number(limitArg);

  if (!name || !Number.isInteger(dailyLimit) || dailyLimit < 1) {
    console.error(
      "Usage: node dist/scripts/create-api-key.js <name> [dailyLimit]",
    );
    process.exit(1);
  }

  const apiKey = randomBytes(24).toString("hex");
  const [user] = await db
    .insert(users)
    .values({ name, apiKey, dailyLimit })
    .returning({ user_id: users.user_id });

  console.log(
    `Created user ${user.user_id} (${name}) with a daily limit of ${dailyLimit}.`,
  );
  console.log(apiKey);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
