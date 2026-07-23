CREATE TABLE "sync_record_mappings" (
  "id" serial PRIMARY KEY NOT NULL,
  "originSystem" varchar(64) NOT NULL,
  "entityType" varchar(64) NOT NULL,
  "originRecordId" varchar(128) NOT NULL,
  "localRecordId" varchar(128) NOT NULL,
  "sourceUpdatedAt" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "sync_record_mappings_origin_unique" ON "sync_record_mappings" USING btree ("originSystem", "entityType", "originRecordId");
--> statement-breakpoint
CREATE INDEX "sync_record_mappings_local_lookup" ON "sync_record_mappings" USING btree ("entityType", "localRecordId");
