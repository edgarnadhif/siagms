import { prisma } from '../lib/db';

async function main() {
  console.log('Mulai melakukan standarisasi & seeding akun...');

  await prisma.$transaction(async (tx) => {
    // 1. MAPPING AKUN LAMA KE KODE BARU (agar JournalEntry tidak error/breaking)
    const mappings = [
      { oldCodes: ['1-100', '1-1000', '1-110'], newCode: '1100', name: 'Kas/Bank' },
      { oldCodes: ['1-200'], newCode: '1300', name: 'Piutang Pembeli' },
      { oldCodes: ['2-100', '2-1000'], newCode: '2100', name: 'Pendapatan Diterima di Muka' },
      { oldCodes: ['4-100', '4-1000'], newCode: '4100', name: 'Pendapatan Penjualan Unit' },
      { oldCodes: ['5-100', '5-1000'], newCode: '5200', name: 'Beban Konstruksi' },
      { oldCodes: ['5-200', '5-2000'], newCode: '5500', name: 'Beban Operasional Kantor' },
    ];

    for (const mapping of mappings) {
      const oldAccounts = await tx.account.findMany({
        where: { code: { in: mapping.oldCodes } }
      });
      
      if (oldAccounts.length > 0) {
        const mainOld = oldAccounts[0];
        const existsNew = await tx.account.findUnique({ where: { code: mapping.newCode } });
        if (!existsNew) {
           await tx.account.update({
             where: { id: mainOld.id },
             data: { code: mapping.newCode, name: mapping.name }
           });
           console.log(`Mapped ${mainOld.code} -> ${mapping.newCode}`);
        }
      }
    }

    // 2. SEED DATA BARU
    const newAccounts = [
      // ASET
      { code: '1100', name: 'Kas', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1200', name: 'Bank', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1300', name: 'Piutang Pembeli', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1400', name: 'Piutang KPR (belum dicairkan)', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1500', name: 'Persediaan Unit Siap Jual', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1600', name: 'Bangunan Dalam Konstruksi (BDK)', type: 'ASET', normalBalance: 'DEBIT' },
      { code: '1700', name: 'Tanah', type: 'ASET', normalBalance: 'DEBIT' },
      // KEWAJIBAN
      { code: '2100', name: 'Pendapatan Diterima di Muka (Booking & DP)', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
      { code: '2200', name: 'Hutang Kontraktor', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
      { code: '2300', name: 'Hutang Usaha', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
      { code: '2400', name: 'Hutang Bank / KPR Induk', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
      // EKUITAS
      { code: '3100', name: 'Modal Disetor', type: 'EKUITAS', normalBalance: 'KREDIT' },
      { code: '3200', name: 'Laba Ditahan', type: 'EKUITAS', normalBalance: 'KREDIT' },
      // PENDAPATAN
      { code: '4100', name: 'Pendapatan Penjualan Unit', type: 'PENDAPATAN', normalBalance: 'KREDIT' },
      { code: '4200', name: 'Pendapatan Lain-lain', type: 'PENDAPATAN', normalBalance: 'KREDIT' },
      // BEBAN
      { code: '5100', name: 'Harga Pokok Penjualan (HPP)', type: 'BEBAN', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Beban Konstruksi', type: 'BEBAN', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Beban Marketing & Penjualan', type: 'BEBAN', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Beban Gaji & Upah', type: 'BEBAN', normalBalance: 'DEBIT' },
      { code: '5500', name: 'Beban Operasional Kantor', type: 'BEBAN', normalBalance: 'DEBIT' },
      { code: '5600', name: 'Beban Lain-lain', type: 'BEBAN', normalBalance: 'DEBIT' },
    ];

    for (const acc of newAccounts) {
      const exists = await tx.account.findUnique({ where: { code: acc.code } });
      if (exists) {
        await tx.account.update({
          where: { id: exists.id },
          data: {
            name: acc.name,
            type: acc.type as any,
            normalBalance: acc.normalBalance as any,
            isActive: true
          }
        });
      } else {
        await tx.account.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as any,
            normalBalance: acc.normalBalance as any,
            isActive: true
          }
        });
      }
    }

    // 3. SOFT DELETE ATAU NON-AKTIFKAN AKUN LAMA YANG TIDAK VALID
    const allAccounts = await tx.account.findMany();
    for (const acc of allAccounts) {
      const is4Digit = /^[1-5]\d{3}$/.test(acc.code);
      if (!is4Digit) {
        await tx.account.update({
          where: { id: acc.id },
          data: { isActive: false, description: "Automated soft-delete: invalid code format" }
        });
        console.log(`Deactivated invalid account code: ${acc.code} - ${acc.name}`);
      }
    }

    // 4. SEED MASTER PELANGGAN & UNIT
    const project = await tx.project.findFirst({ where: { status: 'AKTIF' } });
    if (project) {
      // Create Customers
      const cus1 = await tx.customer.upsert({
        where: { nik: '1234567890123456' },
        update: {},
        create: {
          customerCode: 'CUS-001',
          name: 'Budi Santoso',
          nik: '1234567890123456',
          phone: '081234567890',
          email: 'budi@example.com',
          address: 'Jl. Merdeka No.1',
          paymentMethod: 'KPR',
          bankName: 'Bank BTN',
          kprAmount: 400000000,
          kprTenor: 180,
        }
      });

      const cus2 = await tx.customer.upsert({
        where: { nik: '1234567890123457' },
        update: {},
        create: {
          customerCode: 'CUS-002',
          name: 'Siti Aminah',
          nik: '1234567890123457',
          phone: '081234567891',
          address: 'Jl. Pemuda No.2',
          paymentMethod: 'KPR',
          bankName: 'Bank Mandiri',
          kprAmount: 350000000,
          kprTenor: 120,
        }
      });

      const cus3 = await tx.customer.upsert({
        where: { nik: '1234567890123458' },
        update: {},
        create: {
          customerCode: 'CUS-003',
          name: 'Andi Wijaya',
          nik: '1234567890123458',
          phone: '081234567892',
          address: 'Jl. Sudirman No.3',
          paymentMethod: 'CASH',
        }
      });

      // Create Units
      const unitsData = [
        { unitCode: 'UNIT-A01', blockName: 'A', unitNumber: '01', type: '36/72', landArea: 72, buildingArea: 36, price: 400000000, status: 'TERSEDIA' },
        { unitCode: 'UNIT-A02', blockName: 'A', unitNumber: '02', type: '36/72', landArea: 72, buildingArea: 36, price: 400000000, status: 'BOOKING' },
        { unitCode: 'UNIT-B01', blockName: 'B', unitNumber: '01', type: '45/90', landArea: 90, buildingArea: 45, price: 500000000, status: 'INDENT' },
        { unitCode: 'UNIT-B02', blockName: 'B', unitNumber: '02', type: '45/90', landArea: 90, buildingArea: 45, price: 500000000, status: 'AKAD' },
        { unitCode: 'UNIT-C01', blockName: 'C', unitNumber: '01', type: '60/120', landArea: 120, buildingArea: 60, price: 700000000, status: 'TERSEDIA' },
      ];

      for (const ud of unitsData) {
        await tx.unit.upsert({
          where: { unitCode: ud.unitCode },
          update: {},
          create: {
            ...ud,
            status: ud.status as any,
            projectId: project.id
          }
        });
      }

      // Assign Customer CUS-001 to UNIT-B01
      const unitB01 = await tx.unit.findUnique({ where: { unitCode: 'UNIT-B01' } });
      if (unitB01 && !unitB01.customerId) {
        await tx.unit.update({
          where: { id: unitB01.id },
          data: { customerId: cus1.id }
        });
        console.log('Assigned CUS-001 to UNIT-B01');
      }
    } else {
      console.log('Tidak ada Project AKTIF, melewati seeding Unit & Pelanggan');
    }
  });

  console.log('Proses standarisasi & seeding selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
