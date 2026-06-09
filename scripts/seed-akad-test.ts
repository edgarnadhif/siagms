import { PrismaClient, PaymentMethod, UnitStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get tenant and project
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('No tenant found');
  
  const project = await prisma.project.findFirst({ where: { tenantId: tenant.id } });
  if (!project) throw new Error('No project found');

  console.log('Tenant:', tenant.id);
  console.log('Project:', project.id);

  // Create 2 units
  const unit1 = await prisma.unit.create({
    data: {
      unitCode: 'TST-001',
      blockName: 'Blok Test A',
      unitNumber: '01',
      type: 'Type 36',
      landArea: 72,
      buildingArea: 36,
      price: 350000000,
      status: UnitStatus.AKAD,
      tenantId: tenant.id,
      projectId: project.id,
    }
  });

  const unit2 = await prisma.unit.create({
    data: {
      unitCode: 'TST-002',
      blockName: 'Blok Test B',
      unitNumber: '02',
      type: 'Type 45',
      landArea: 90,
      buildingArea: 45,
      price: 450000000,
      status: UnitStatus.AKAD,
      tenantId: tenant.id,
      projectId: project.id,
    }
  });

  console.log('Unit 1 created:', unit1.id);
  console.log('Unit 2 created:', unit2.id);

  // Create customer KPR
  const customerKPR = await prisma.customer.create({
    data: {
      customerCode: 'PLG-TST-001',
      name: 'Test Pelanggan KPR',
      nik: '3201010101010001',
      phone: '081234567890',
      email: 'test.kpr@email.com',
      address: 'Jl. Test No. 1',
      paymentMethod: PaymentMethod.KPR,
      bankName: 'Bank BNI',
      kprAmount: 280000000,
      kprTenor: 15,
      tenantId: tenant.id,
    }
  });

  // Create customer Cash Keras
  const customerCash = await prisma.customer.create({
    data: {
      customerCode: 'PLG-TST-002',
      name: 'Test Pelanggan Cash Keras',
      nik: '3201010101010002',
      phone: '081234567891',
      email: 'test.cash@email.com',
      address: 'Jl. Test No. 2',
      paymentMethod: PaymentMethod.CASH,
      tenantId: tenant.id,
    }
  });

  console.log('Customer KPR created:', customerKPR.id);
  console.log('Customer Cash created:', customerCash.id);

  // Link customers to units
  await prisma.unit.update({
    where: { id: unit1.id },
    data: { customerId: customerKPR.id }
  });

  await prisma.unit.update({
    where: { id: unit2.id },
    data: { customerId: customerCash.id }
  });

  console.log('✅ Data akad test berhasil dibuat!');
  console.log('Unit TST-001 → KPR (Test Pelanggan KPR)');
  console.log('Unit TST-002 → Cash Keras (Test Pelanggan Cash Keras)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
