ALTER TABLE "Account"
ADD COLUMN IF NOT EXISTS "isSystem" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "JournalMapping" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "debitAccountId" TEXT NOT NULL,
  "creditAccountId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "JournalMapping_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "JournalMapping"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "JournalMapping_tenantId_category_key"
ON "JournalMapping"("tenantId", "category");

CREATE INDEX IF NOT EXISTS "JournalMapping_tenantId_idx"
ON "JournalMapping"("tenantId");

CREATE INDEX IF NOT EXISTS "JournalMapping_tenantId_isActive_idx"
ON "JournalMapping"("tenantId", "isActive");

DO $$
BEGIN
  ALTER TABLE "JournalMapping"
  ADD CONSTRAINT "JournalMapping_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "JournalMapping"
  ADD CONSTRAINT "JournalMapping_debitAccountId_fkey"
  FOREIGN KEY ("debitAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "JournalMapping"
  ADD CONSTRAINT "JournalMapping_creditAccountId_fkey"
  FOREIGN KEY ("creditAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
