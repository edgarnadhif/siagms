-- Login hanya menggunakan email, sehingga email harus unik lintas tenant.
DROP INDEX IF EXISTS "User_tenantId_email_key";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Transaksi yang dibatalkan dipertahankan untuk audit, tetapi tidak boleh
-- dihitung kembali dalam siklus penjualan unit berikutnya.
ALTER TYPE "StatusPengakuan" ADD VALUE IF NOT EXISTS 'dibatalkan';
