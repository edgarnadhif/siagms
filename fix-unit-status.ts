import 'dotenv/config';
import { prisma } from './lib/db';

async function main() {
  const result = await prisma.unit.updateMany({
    where: { 
      unitCode: { in: ['UNIT-T02', 'UNIT-T03'] },
      // Optional: check that no revenue transactions exist, but unitCode in T02, T03 is specific enough
    },
    data: { status: 'TERSEDIA' }
  });

  console.log(`Updated ${result.count} units back to TERSEDIA.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
