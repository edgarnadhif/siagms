-- Remap legacy MARKETING users to AKUNTAN before removing the enum value.
UPDATE "User"
SET "role" = 'AKUNTAN'
WHERE "role" = 'MARKETING';

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'AKUNTAN');

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role"
USING ("role"::text::"Role");

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'AKUNTAN';

DROP TYPE "Role_old";
