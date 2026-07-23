import { Client } from "pg";

const isVercelProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
const connectionString = process.env.DATABASE_URL;

if (!isVercelProduction) {
  console.log("[Sync migration] Skipped outside Vercel production.");
  process.exit(0);
}

if (!connectionString) {
  console.error("[Sync migration] DATABASE_URL is required in Vercel production.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const sql = `
  CREATE TABLE IF NOT EXISTS "sync_record_mappings" (
    "id" serial PRIMARY KEY NOT NULL,
    "originSystem" varchar(64) NOT NULL,
    "entityType" varchar(64) NOT NULL,
    "originRecordId" varchar(128) NOT NULL,
    "localRecordId" varchar(128) NOT NULL,
    "sourceUpdatedAt" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS "sync_record_mappings_origin_unique"
    ON "sync_record_mappings" ("originSystem", "entityType", "originRecordId");
  CREATE INDEX IF NOT EXISTS "sync_record_mappings_local_lookup"
    ON "sync_record_mappings" ("entityType", "localRecordId");
`;

try {
  await client.connect();
  await client.query(sql);
  console.log("[Sync migration] sync_record_mappings is ready.");
} catch (error) {
  console.error("[Sync migration] Unable to prepare sync_record_mappings:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
