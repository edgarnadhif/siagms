import * as dotenv from 'dotenv';
dotenv.config();

if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes(':@')) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(':@', ':%40');
  }
}

const { prisma } = require('../lib/db');

async function main() {
  console.log('=== MEMULAI SKENARIO UJI COBA PEMBATALAN UNIT ===');

  // 1. Ambil Tenant & Project aktif
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error('Tenant tidak ditemukan');

  const project = await prisma.project.findFirst({
    where: { tenantId: tenant.id, status: 'AKTIF' }
  });
  if (!project) throw new Error('Proyek aktif tidak ditemukan');

  console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);
  console.log(`Using Project: ${project.name} (${project.code})`);

  // 2. Buat Unit Test baru
  const unitCode = `TST-CANCEL-${Date.now().toString().slice(-4)}`;
  const unit = await prisma.unit.create({
    data: {
      tenantId: tenant.id,
      projectId: project.id,
      unitCode,
      blockName: 'TST',
      unitNumber: '99',
      type: '36/72',
      landArea: 72,
      buildingArea: 36,
      price: 350000000,
      status: 'TERSEDIA',
    }
  });
  console.log(`\n[1] Unit berhasil dibuat: ${unit.unitCode} (ID: ${unit.id}) - Status: ${unit.status}`);

  // 3. Buat Pelanggan Test baru
  const customerCode = `PLG-TST-${Date.now().toString().slice(-4)}`;
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      customerCode,
      name: 'Rian Hidayat (Test Cancel)',
      nik: `320101${Date.now().toString()}`,
      phone: '081299998888',
      address: 'Jl. Uji Coba No. 99',
      paymentMethod: 'CASH',
    }
  });
  console.log(`[2] Pelanggan berhasil dibuat: ${customer.name} (${customer.customerCode})`);

  // 4. Assign Pelanggan ke Unit
  await prisma.unit.update({
    where: { id: unit.id },
    data: { customerId: customer.id }
  });
  console.log(`[3] Pelanggan di-assign ke Unit ${unit.unitCode}`);

  // 5. Input Transaksi Booking Fee (Rp 2.000.000)
  const tx1 = await prisma.transaction.create({
    data: {
      tenantId: tenant.id,
      reference: `BF-${unitCode}`,
      date: new Date(),
      description: `Booking Fee - ${customer.name} - Unit ${unit.unitCode}`,
      category: 'BOOKING_FEE',
      amount: 2000000,
      projectId: project.id,
      unitId: unit.id,
      customerId: customer.id,
    }
  });
  console.log(`[4] Transaksi Booking Fee dicatat: Rp 2.000.000 (Ref: ${tx1.reference})`);

  // 6. Input Transaksi Down Payment (Rp 15.000.000)
  const tx2 = await prisma.transaction.create({
    data: {
      tenantId: tenant.id,
      reference: `DP-${unitCode}`,
      date: new Date(),
      description: `Down Payment - ${customer.name} - Unit ${unit.unitCode}`,
      category: 'DOWN_PAYMENT',
      amount: 15000000,
      projectId: project.id,
      unitId: unit.id,
      customerId: customer.id,
    }
  });
  console.log(`[5] Transaksi Down Payment dicatat: Rp 15.000.000 (Ref: ${tx2.reference})`);

  // 7. Simulasikan sync status unit (status unit menjadi INDENT)
  const updatedUnitBeforeCancel = await prisma.unit.update({
    where: { id: unit.id },
    data: { status: 'INDENT' }
  });
  console.log(`[6] Status Unit terupdate menjadi: ${updatedUnitBeforeCancel.status}`);

  // 8. JALANKAN PROSES PEMBATALAN (Sama persis dengan logika API Cancel)
  console.log('\n--- JALANKAN PROSES PEMBATALAN UNIT ---');
  
  const cancelDate = new Date();
  const alasan = 'Pembeli tidak melanjutkan pembayaran berkas';

  // Ambil transaksi unit yang ada
  const activeTransactions = await prisma.transaction.findMany({
    where: {
      tenantId: tenant.id,
      unitId: unit.id,
      category: { in: ['BOOKING_FEE', 'DOWN_PAYMENT', 'PENCAIRAN_KPR', 'PELUNASAN_CASH', 'ANGSURAN_KPR'] }
    }
  });

  let totalBF = 0;
  let totalRefund = 0;
  activeTransactions.forEach(t => {
    const amt = Number(t.amount);
    if (t.category === 'BOOKING_FEE') {
      totalBF += amt;
    } else {
      totalRefund += amt;
    }
  });

  console.log(`Perhitungan Dana:`);
  console.log(`- Booking Fee Hangus: Rp ${totalBF.toLocaleString('id-ID')}`);
  console.log(`- DP/Lainnya Direfund: Rp ${totalRefund.toLocaleString('id-ID')}`);

  const cancelResult = await prisma.$transaction(async (tx) => {
    // A. Pastikan akun-akun pembatalan ada
    let accPendapatanMuka = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '2100' } });
    if (!accPendapatanMuka) {
      accPendapatanMuka = await tx.account.create({
        data: { tenantId: tenant.id, code: '2100', name: 'Pendapatan Diterima di Muka', type: 'KEWAJIBAN', normalBalance: 'KREDIT', isActive: true }
      });
    }

    let accPendapatanLain = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '4200' } });
    if (!accPendapatanLain) {
      accPendapatanLain = await tx.account.create({
        data: { tenantId: tenant.id, code: '4200', name: 'Pendapatan Lain-lain', type: 'PENDAPATAN', normalBalance: 'KREDIT', isActive: true }
      });
    }

    let accBank = await tx.account.findFirst({ where: { tenantId: tenant.id, code: '1200' } });
    if (!accBank) {
      accBank = await tx.account.create({
        data: { tenantId: tenant.id, code: '1200', name: 'Bank', type: 'ASET', normalBalance: 'DEBIT', isActive: true }
      });
    }

    // B. Buat Jurnal Header & Jurnal Entry Pembalikan
    let journalRef = `BATAL-${unit.unitCode}-${Date.now().toString().slice(-6)}`;
    const journalDesc = `Pembalikan & Pembatalan - ${customer.name} - ${unit.unitCode}`;

    const journal = await tx.journal.create({
      data: {
        tenantId: tenant.id,
        referenceNo: journalRef,
        description: journalDesc,
        date: cancelDate,
      }
    });

    const journalEntriesData = [];
    const totalOut = totalBF + totalRefund;

    // 1. Debit Pendapatan Diterima di Muka (2100) sebesar total (BF + DP)
    journalEntriesData.push({
      tenantId: tenant.id,
      journalId: journal.id,
      reference: journalRef,
      date: cancelDate,
      description: journalDesc + " (Pembalikannya)",
      accountId: accPendapatanMuka.id,
      debit: totalOut,
      credit: 0,
      unitId: unit.id,
      projectId: unit.projectId,
      isAuto: true,
    });

    // 2. Kredit Pendapatan Lain-lain (4200) sebesar BF hangus
    if (totalBF > 0) {
      journalEntriesData.push({
        tenantId: tenant.id,
        journalId: journal.id,
        reference: journalRef,
        date: cancelDate,
        description: journalDesc + " (BF Hangus)",
        accountId: accPendapatanLain.id,
        debit: 0,
        credit: totalBF,
        unitId: unit.id,
        projectId: unit.projectId,
        isAuto: true,
      });
    }

    // 3. Kredit Bank (1200) sebesar refund DP
    if (totalRefund > 0) {
      journalEntriesData.push({
        tenantId: tenant.id,
        journalId: journal.id,
        reference: journalRef,
        date: cancelDate,
        description: journalDesc + " (Refund DP/Lain)",
        accountId: accBank.id,
        debit: 0,
        credit: totalRefund,
        unitId: unit.id,
        projectId: unit.projectId,
        isAuto: true,
      });
    }

    await tx.journalEntry.createMany({
      data: journalEntriesData,
    });

    // C. Buat data Cancellation
    const cancellation = await tx.cancellation.create({
      data: {
        tenantId: tenant.id,
        unitId: unit.id,
        customerId: customer.id,
        customerName: customer.name,
        customerCode: customer.customerCode,
        tanggalBatal: cancelDate,
        alasan: alasan,
        totalBFHangus: totalBF,
      }
    });

    // D. Kembalikan unit ke TERSEDIA dan customerId = null
    const updatedUnit = await tx.unit.update({
      where: { id: unit.id },
      data: { status: 'TERSEDIA', customerId: null }
    });

    return { cancellation, updatedUnit, journalRef };
  });

  console.log(`\n[7] Pembatalan berhasil dijalankan!`);
  console.log(`- Unit ${cancelResult.updatedUnit.unitCode} kembali berstatus: ${cancelResult.updatedUnit.status}`);
  console.log(`- Customer ID Unit: ${cancelResult.updatedUnit.customerId ?? 'null (berhasil di-unassign)'}`);

  // 9. VERIFIKASI JURNAL DI DATABASE & TAMPILAN PROYEKNYA
  console.log(`\n=== VERIFIKASI JURNAL DI DATABASE ===`);
  const dbEntries = await prisma.journalEntry.findMany({
    where: { reference: cancelResult.journalRef },
    include: {
      account: { select: { code: true, name: true } },
      project: { select: { code: true, name: true } }
    }
  });

  console.log(`Reference Jurnal: ${cancelResult.journalRef}`);
  console.log('Detail Entri Jurnal:');
  console.table(
    dbEntries.map(e => ({
      Akun: `${e.account.code} - ${e.account.name}`,
      Debit: Number(e.debit).toLocaleString('id-ID'),
      Kredit: Number(e.credit).toLocaleString('id-ID'),
      'Proyek Terkait': e.project ? `${e.project.code} - ${e.project.name}` : 'Global (KOSONG)',
      Unit: unitCode
    }))
  );

  console.log('\n=== SELESAI ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
