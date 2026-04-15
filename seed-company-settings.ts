import 'dotenv/config';
import { prisma } from './lib/db';

async function main() {
  const tenant = await prisma.tenant.findFirst();

  if (!tenant) {
    console.error('No tenant found. Cannot create company settings.');
    return;
  }

  const result = await prisma.companySettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      id: 'company-settings',
      tenantId: tenant.id,
      companyName: 'CV. Griya Mandiri Sejahtera',
      companyAddress: 'Jl. Raya Purwokerto No. 45, Banyumas',
      companyPhone: '0281-123456',
      companyEmail: 'info@griyamandiri.com',
    }
  });
  
  console.log('Seed company settings success:', result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
