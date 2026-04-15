BEGIN;

CREATE TABLE IF NOT EXISTS "CompanySettings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL DEFAULT 'Nama Perusahaan',
  "companyAddress" TEXT,
  "companyPhone" TEXT,
  "companyEmail" TEXT,
  "logoUrl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CompanySettings"
  DROP CONSTRAINT IF EXISTS "CompanySettings_tenantId_fkey";

ALTER TABLE "CompanySettings"
  ADD CONSTRAINT "CompanySettings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "CompanySettings_tenantId_key"
  ON "CompanySettings"("tenantId");

INSERT INTO "CompanySettings" (
  "id",
  "tenantId",
  "companyName",
  "companyAddress",
  "companyPhone",
  "companyEmail",
  "logoUrl"
)
SELECT
  "Tenant"."id" || '-company-settings',
  "Tenant"."id",
  COALESCE("CompanyProfile"."name", 'CV. Griya Mandiri Sejahtera'),
  COALESCE("CompanyProfile"."address", 'Jl. Raya Purwokerto No. 45, Banyumas'),
  COALESCE("CompanyProfile"."phone", '0281-123456'),
  COALESCE("CompanyProfile"."email", 'info@griyamandiri.com'),
  "CompanyProfile"."logoUrl"
FROM "Tenant"
LEFT JOIN "CompanyProfile"
  ON "CompanyProfile"."tenantId" = "Tenant"."id"
WHERE NOT EXISTS (
  SELECT 1
  FROM "CompanySettings"
  WHERE "CompanySettings"."tenantId" = "Tenant"."id"
);

COMMIT;
