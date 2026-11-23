import dotenv from "dotenv";

dotenv.config({ path: ".env.rmeme", quiet: true });

export const config = {
  port: Number(process.env.PORT ?? 9000),
  databaseUrl: process.env.DATABASE_URL ?? "file:./rmeme.db",
  fileStoreBasePath: process.env.FILE_STORE_BASE_PATH ?? "",
  hostedFileBasePath: process.env.HOSTED_FILE_BASE_PATH ?? "",
};
