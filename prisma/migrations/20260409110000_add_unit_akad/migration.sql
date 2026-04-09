CREATE TABLE "UnitAkad" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tanggalAkad" TIMESTAMP(3) NOT NULL,
    "namaBank" TEXT NOT NULL,
    "nomorAkad" TEXT NOT NULL,
    "nilaiKPR" DECIMAL(65,30) NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitAkad_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UnitAkad_tenantId_nomorAkad_key" ON "UnitAkad"("tenantId", "nomorAkad");
CREATE INDEX "UnitAkad_tenantId_unitId_idx" ON "UnitAkad"("tenantId", "unitId");
CREATE INDEX "UnitAkad_tenantId_customerId_idx" ON "UnitAkad"("tenantId", "customerId");

ALTER TABLE "UnitAkad" ADD CONSTRAINT "UnitAkad_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitAkad" ADD CONSTRAINT "UnitAkad_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UnitAkad" ADD CONSTRAINT "UnitAkad_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
