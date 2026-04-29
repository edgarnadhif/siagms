ALTER TABLE "JournalEntry"
ADD COLUMN IF NOT EXISTS "projectId" TEXT;

CREATE INDEX IF NOT EXISTS "JournalEntry_tenantId_projectId_idx"
ON "JournalEntry"("tenantId", "projectId");

DO $$
BEGIN
  ALTER TABLE "JournalEntry"
  ADD CONSTRAINT "JournalEntry_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
