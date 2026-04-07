-- Hapus transaksi terkait unit tidak valid dulu
UPDATE "Transaction" SET "unitId" = NULL WHERE "unitId" IN (
  SELECT id FROM "Unit" WHERE "unitCode" IN ('UNIT--01', 'UNIT-adsasd')
);

-- Hapus unit tidak valid
DELETE FROM "Unit" WHERE "unitCode" IN ('UNIT--01', 'UNIT-adsasd');

-- Reset UNIT-A02 ke TERSEDIA
UPDATE "Unit" SET status = 'TERSEDIA'::"UnitStatus", "customerId" = NULL 
WHERE "unitCode" = 'UNIT-A02';

SELECT "unitCode", status, "customerId" FROM "Unit" ORDER BY "unitCode";
