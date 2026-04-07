import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up invalid units...');
  
  // 1. Delete transactions linked to invalid units (to respect foreign keys if any)
  const invalidUnits = await prisma.unit.findMany({
    where: { unitCode: { in: ['UNIT--01', 'UNIT-adsasd'] } }
  });
  
  if (invalidUnits.length > 0) {
    const invalidIds = invalidUnits.map(u => u.id);
    await prisma.transaction.updateMany({
      where: { unitId: { in: invalidIds } },
      data: { unitId: null }
    });
    
    await prisma.unit.deleteMany({
      where: { unitCode: { in: ['UNIT--01', 'UNIT-adsasd'] } }
    });
    console.log('Deleted units: UNIT--01 and UNIT-adsasd');
  }

  // 2. Reset UNIT-A02
  const unitA02 = await prisma.unit.findUnique({ where: { unitCode: 'UNIT-A02' } });
  if (unitA02) {
    await prisma.unit.update({
      where: { id: unitA02.id },
      data: { status: 'TERSEDIA', customerId: null }
    });
    console.log('Reset UNIT-A02 to TERSEDIA');
  }

  // 3. Remap transactions because we are changing enums
  // 'PELUNASAN' -> 'PELUNASAN_CASH'
  // 'BIAYA_PROYEK' -> 'BIAYA_KONSTRUKSI'
  // Wait, Prisma doesn't let us query the enum if it's changing, but we can do raw query.
  await prisma.$executeRaw`UPDATE "Transaction" SET "category" = 'PELUNASAN_CASH' WHERE "category" = 'PELUNASAN';`
  await prisma.$executeRaw`UPDATE "Transaction" SET "category" = 'BIAYA_KONSTRUKSI' WHERE "category" = 'BIAYA_PROYEK';`
  
  console.log('Done cleaning.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
