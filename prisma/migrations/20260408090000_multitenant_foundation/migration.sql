-- Multi-tenant foundation for SIAGMS.
-- Review on a staging database first, especially if production already contains data.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role_new') THEN
    CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'AKUNTAN', 'MARKETING');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Tenant" ("name", "slug")
SELECT 'Default Tenant', 'default-tenant'
WHERE NOT EXISTS (SELECT 1 FROM "Tenant");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fullName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "User"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'role') THEN
    ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new"
      USING CASE "role"::text
        WHEN 'ADMIN' THEN 'SUPER_ADMIN'::"Role_new"
        ELSE 'MARKETING'::"Role_new"
      END;
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MARKETING';
  ELSE
    ALTER TABLE "User" ADD COLUMN "role" "Role_new" NOT NULL DEFAULT 'MARKETING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    DROP TYPE "Role";
  END IF;
  ALTER TYPE "Role_new" RENAME TO "Role";
END $$;

ALTER TABLE "CompanyProfile" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "CompanyProfile"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Project"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Account"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Transaction"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "JournalEntry"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Customer"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Unit" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Unit"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "SerahTerima" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "SerahTerima"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Cancellation" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "Cancellation"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE "CalendarEvent"
SET "tenantId" = (SELECT "id" FROM "Tenant" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CompanyProfile" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Account" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Transaction" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "JournalEntry" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Unit" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "SerahTerima" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Cancellation" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CalendarEvent" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyProfile"
  ADD CONSTRAINT "CompanyProfile_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account"
  ADD CONSTRAINT "Account_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalEntry"
  ADD CONSTRAINT "JournalEntry_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit"
  ADD CONSTRAINT "Unit_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SerahTerima"
  ADD CONSTRAINT "SerahTerima_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Cancellation"
  ADD CONSTRAINT "Cancellation_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent"
  ADD CONSTRAINT "CalendarEvent_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyProfile_tenantId_key" ON "CompanyProfile"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Project_tenantId_code_key" ON "Project"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "Account_tenantId_code_key" ON "Account"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "Transaction_tenantId_reference_key" ON "Transaction"("tenantId", "reference");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_tenantId_customerCode_key" ON "Customer"("tenantId", "customerCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_tenantId_nik_key" ON "Customer"("tenantId", "nik");
CREATE UNIQUE INDEX IF NOT EXISTS "Unit_tenantId_unitCode_key" ON "Unit"("tenantId", "unitCode");
CREATE INDEX IF NOT EXISTS "User_tenantId_role_idx" ON "User"("tenantId", "role");
CREATE INDEX IF NOT EXISTS "Project_tenantId_status_idx" ON "Project"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Account_tenantId_isActive_idx" ON "Account"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "Transaction_tenantId_date_idx" ON "Transaction"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "JournalEntry_tenantId_date_idx" ON "JournalEntry"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Customer_tenantId_isActive_idx" ON "Customer"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "Unit_tenantId_status_idx" ON "Unit"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "CalendarEvent_tenantId_date_idx" ON "CalendarEvent"("tenantId", "date");

COMMIT;
