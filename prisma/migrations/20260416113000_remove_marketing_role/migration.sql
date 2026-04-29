-- Remap legacy MARKETING users to AKUNTAN before removing the enum value.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
      AND e.enumlabel = 'MARKETING'
  ) THEN
    UPDATE "User"
    SET "role" = 'AKUNTAN'
    WHERE "role"::text = 'MARKETING';
  END IF;
END $$;

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'AKUNTAN');

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role"
USING ("role"::text::"Role");

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'AKUNTAN';

DROP TYPE "Role_old";
