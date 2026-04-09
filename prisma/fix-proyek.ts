const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.project.updateMany({
    where: {
      OR: [
        { location: null },
        { location: "" },
        { location: "-" }
      ]
    },
    data: {
      location: "Lokasi Belum Diatur"
    }
  });
  console.log(`Updated ${result.count} projects with default location.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
