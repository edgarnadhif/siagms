CREATE TABLE IF NOT EXISTS "Journal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Transaction"
  ADD COLUMN IF NOT EXISTS "kwitansiNo" TEXT,
  ADD COLUMN IF NOT EXISTS "kwitansiDate" TIMESTAMP(3);

ALTER TABLE "JournalEntry"
  ADD COLUMN IF NOT EXISTS "journalId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Journal_tenantId_fkey'
  ) THEN
    ALTER TABLE "Journal"
      ADD CONSTRAINT "Journal_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'JournalEntry_journalId_fkey'
  ) THEN
    ALTER TABLE "JournalEntry"
      ADD CONSTRAINT "JournalEntry_journalId_fkey"
      FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Journal_tenantId_referenceNo_key" ON "Journal"("tenantId", "referenceNo");
CREATE INDEX IF NOT EXISTS "Journal_tenantId_date_idx" ON "Journal"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "JournalEntry_tenantId_journalId_idx" ON "JournalEntry"("tenantId", "journalId");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_tenantId_kwitansiNo_key" ON "Transaction"("tenantId", "kwitansiNo");
CREATE INDEX IF NOT EXISTS "Transaction_tenantId_kwitansiNo_idx" ON "Transaction"("tenantId", "kwitansiNo");
