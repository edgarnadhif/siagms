const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper to generate NIK
function generateNIK(birthDateStr, gender = 'male') {
  // BirthDateStr format: YYYY-MM-DD
  const date = new Date(birthDateStr);
  const year = date.getFullYear().toString().slice(-2);
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  let day = date.getDate();
  if (gender === 'female') {
    day += 40; // Indon NIK gender offset for female
  }
  const dayStr = day.toString().padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit suffix
  return `332601${dayStr}${month}${year}${rand}`;
}

async function main() {
  console.log('Starting seed dummy data for last year (October 2025 - July 2026)...');

  // 1. Get first tenant
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('No tenant found. Register a tenant first!');
  }
  const tenantId = tenant.id;
  console.log(`Using Tenant: ${tenant.name} (${tenantId})`);

  // 2. Clear existing operational data (fail-safe)
  await prisma.journalEntry.deleteMany({ where: { tenantId } });
  await prisma.journal.deleteMany({ where: { tenantId } });
  await prisma.transaction.deleteMany({ where: { tenantId } });
  await prisma.serahTerima.deleteMany({ where: { tenantId } });
  await prisma.cancellation.deleteMany({ where: { tenantId } });
  await prisma.unitAkad.deleteMany({ where: { tenantId } });
  await prisma.calendarEvent.deleteMany({ where: { tenantId } });
  await prisma.unit.deleteMany({ where: { tenantId } });
  await prisma.customer.deleteMany({ where: { tenantId } });
  await prisma.project.deleteMany({ where: { tenantId } });
  console.log('Cleared existing operational data.');

  // 3. Create Project: Griya Azzahra 3
  const project = await prisma.project.create({
    data: {
      tenantId,
      code: 'GA3',
      name: 'Griya Azzahra 3',
      description: 'Proyek Perumahan Subsidi & Komersil Azzahra Tahap 3',
      location: 'KAB BATANG, Warungasem, Kaliwareng',
      startDate: new Date('2025-10-01'),
      status: 'AKTIF',
      budget: 4500000000, // Rp 4,5 Miliar
    }
  });
  console.log(`Created Project: ${project.name}`);

  // Fetch essential accounts
  const findAccount = async (code) => {
    const acc = await prisma.account.findFirst({ where: { tenantId, code } });
    if (!acc) throw new Error(`Account code ${code} not found!`);
    return acc;
  };

  const accKas = await findAccount('1100');
  const accBank = await findAccount('1200');
  const accBdk = await findAccount('1600');
  const accPendMuka = await findAccount('2100');
  const accPendPenjualan = await findAccount('4100');
  const accHpp = await findAccount('5100');
  const accBMarketing = await findAccount('5300');
  const accBGaji = await findAccount('5400');
  const accBOperasional = await findAccount('5500');

  // Helper to create manual/auto journal entry
  const createJournalWithEntries = async (ref, desc, date, entriesList) => {
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        referenceNo: ref,
        description: desc,
        date: new Date(date),
      }
    });

    for (const e of entriesList) {
      await prisma.journalEntry.create({
        data: {
          tenantId,
          journalId: journal.id,
          reference: ref,
          date: new Date(date),
          description: desc,
          accountId: e.accountId,
          debit: e.debit || 0,
          credit: e.credit || 0,
          isAuto: true,
          projectId: e.projectId || null,
          unitId: e.unitId || null,
        }
      });
    }
    return journal;
  };

  // Helper to create transaction + automatic journal entries
  const insertTransactionWithJournal = async (ref, dateStr, desc, category, amount, custId, unitId, isCash = true) => {
    const date = new Date(dateStr);
    const trans = await prisma.transaction.create({
      data: {
        tenantId,
        reference: ref,
        date,
        description: desc,
        category,
        amount,
        projectId: project.id,
        customerId: custId,
        unitId,
        skema_pembayaran: isCash ? 'cash' : 'kpr',
        status_pengakuan: 'diterima',
        sumber_pembayaran: 'pembeli',
      }
    });

    // Generate matching Auto Journal Entries
    const entries = [];
    if (['BOOKING_FEE', 'DOWN_PAYMENT', 'ANGSURAN_KPR', 'PENCAIRAN_KPR', 'PELUNASAN_CASH'].includes(category)) {
      entries.push({ accountId: accBank.id, debit: amount, credit: 0, projectId: project.id, unitId });
      entries.push({ accountId: accPendMuka.id, debit: 0, credit: amount, projectId: project.id, unitId });
    } else if (category === 'BIAYA_KONSTRUKSI') {
      entries.push({ accountId: accBdk.id, debit: amount, credit: 0, projectId: project.id, unitId });
      entries.push({ accountId: accBank.id, debit: 0, credit: amount, projectId: project.id, unitId });
    } else if (category === 'BIAYA_MARKETING') {
      entries.push({ accountId: accBMarketing.id, debit: amount, credit: 0, projectId: project.id, unitId });
      entries.push({ accountId: accBank.id, debit: 0, credit: amount, projectId: project.id, unitId });
    } else if (category === 'BIAYA_GAJI') {
      entries.push({ accountId: accBGaji.id, debit: amount, credit: 0, projectId: project.id, unitId });
      entries.push({ accountId: accBank.id, debit: 0, credit: amount, projectId: project.id, unitId });
    } else if (category === 'BIAYA_OPERASIONAL') {
      entries.push({ accountId: accBOperasional.id, debit: amount, credit: 0, projectId: project.id, unitId });
      entries.push({ accountId: accBank.id, debit: 0, credit: amount, projectId: project.id, unitId });
    }

    if (entries.length > 0) {
      await prisma.journalEntry.createMany({
        data: entries.map(e => ({
          tenantId,
          reference: ref,
          date,
          description: `Auto Journal - ${desc}`,
          transactionId: trans.id,
          projectId: e.projectId,
          unitId: e.unitId,
          accountId: e.accountId,
          debit: e.debit,
          credit: e.credit,
          isAuto: true,
        }))
      });
    }

    return trans;
  };

  // 4. Generate 11 Customers from Pekalongan, age 25-30
  const customersData = [
    { name: 'Slamet Raharjo', birth: '1997-06-12', gender: 'male', phone: '085712345001', address: 'Jl. Hayam Wuruk No. 23, Pekalongan', method: 'KPR' },
    { name: 'Joko Susilo', birth: '1996-08-20', gender: 'male', phone: '085712345002', address: 'Jl. Kuripan Lor Gg. 4, Pekalongan', method: 'KPR' },
    { name: 'Dian Larasati', birth: '1999-11-05', gender: 'female', phone: '085712345003', address: 'Jl. KH Wahid Hasyim No. 12, Pekalongan', method: 'CASH' },
    { name: 'Rina Herawati', birth: '2000-02-14', gender: 'female', phone: '085712345004', address: 'Jl. Diponegoro No. 89, Pekalongan', method: 'KPR' },
    { name: 'Eko Prasetyo', birth: '1998-04-28', gender: 'male', phone: '085712345005', address: 'Jl. Slamet No. 14, Pekalongan', method: 'CASH' },
    { name: 'Tri Wulandari', birth: '1995-10-30', gender: 'female', phone: '085712345006', address: 'Jl. Sultan Agung No. 56, Pekalongan', method: 'KPR' },
    { name: 'Bambang Utomo', birth: '1996-01-22', gender: 'male', phone: '085712345007', address: 'Jl. Merdeka No. 45, Pekalongan', method: 'KPR' },
    { name: 'Wahyu Nugroho', birth: '1997-09-08', gender: 'male', phone: '085712345008', address: 'Jl. Kartini No. Gg. 2, Pekalongan', method: 'CASH' },
    { name: 'Sri Wahyuni', birth: '1998-12-15', gender: 'female', phone: '085712345009', address: 'Jl. Melati Raya No. 10, Pekalongan', method: 'KPR' },
    { name: 'Agung Setiawan', birth: '1999-03-24', gender: 'male', phone: '085712345010', address: 'Jl. Cendrawasih No. Gg. 5, Pekalongan', method: 'CASH' },
    { name: 'Budi Hartono', birth: '2000-07-01', gender: 'male', phone: '085712345011', address: 'Jl. Gajah Mada No. 120, Pekalongan', method: 'KPR' },
  ];

  const customers = [];
  for (let i = 0; i < customersData.length; i++) {
    const c = customersData[i];
    const created = await prisma.customer.create({
      data: {
        tenantId,
        customerCode: `CUS-${(i + 1).toString().padStart(3, '0')}`,
        name: c.name,
        nik: generateNIK(c.birth, c.gender),
        phone: c.phone,
        address: c.address,
        paymentMethod: c.method,
        bankName: c.method === 'KPR' ? 'Bank BTN' : null,
      }
    });
    customers.push(created);
  }
  console.log(`Created ${customers.length} Customers.`);

  // 5. Generate 30 Units (A01 - A15, B01 - B15)
  const units = [];
  for (let i = 1; i <= 15; i++) {
    const codeA = `A-${i.toString().padStart(2, '0')}`;
    const uA = await prisma.unit.create({
      data: {
        tenantId,
        unitCode: `GA3-${codeA}`,
        blockName: 'A',
        unitNumber: i.toString().padStart(2, '0'),
        type: '36/72',
        landArea: 72,
        buildingArea: 36,
        price: 380000000, // Rp 380.000.000
        status: 'TERSEDIA',
        projectId: project.id,
      }
    });
    units.push(uA);

    const codeB = `B-${i.toString().padStart(2, '0')}`;
    const uB = await prisma.unit.create({
      data: {
        tenantId,
        unitCode: `GA3-${codeB}`,
        blockName: 'B',
        unitNumber: i.toString().padStart(2, '0'),
        type: '45/90',
        landArea: 90,
        buildingArea: 45,
        price: 480000000, // Rp 480.000.000
        status: 'TERSEDIA',
        projectId: project.id,
      }
    });
    units.push(uB);
  }
  console.log(`Created ${units.length} Units.`);

  // 6. Setup 6 Sold & Delivered Units (SERAH_TERIMA)
  // We choose units: GA3-A-01, GA3-A-02, GA3-A-03, GA3-B-01, GA3-B-02, GA3-B-03
  // Assign to Customers: Slamet (0), Joko (1), Dian (2), Rina (3), Eko (4), Tri (5)
  const soldUnitConfigs = [
    { unitIndex: 0, customerIndex: 0, startMonth: 10, isCash: false }, // Oct 2025, Slamet, KPR
    { unitIndex: 2, customerIndex: 1, startMonth: 10, isCash: false }, // Oct 2025, Joko, KPR
    { unitIndex: 4, customerIndex: 2, startMonth: 11, isCash: true },  // Nov 2025, Dian, Cash
    { unitIndex: 6, customerIndex: 3, startMonth: 11, isCash: false }, // Nov 2025, Rina, KPR
    { unitIndex: 8, customerIndex: 4, startMonth: 12, isCash: true },  // Dec 2025, Eko, Cash
    { unitIndex: 10, customerIndex: 5, startMonth: 12, isCash: false }, // Dec 2025, Tri, KPR
  ];

  // We will trace construction cost at unit level for COGS later
  // Let's assume proportional construction cost is Rp 55.000.000 per unit
  const perUnitCost = 55000000;

  for (const conf of soldUnitConfigs) {
    const unit = units[conf.unitIndex];
    const customer = customers[conf.customerIndex];
    const price = Number(unit.price);

    // Link customer to unit
    await prisma.unit.update({
      where: { id: unit.id },
      data: { customerId: customer.id, status: 'SERAH_TERIMA' }
    });

    const startYear = 2025;
    const m = conf.startMonth; // e.g. 10 (Oct), 11 (Nov), 12 (Dec)
    
    // Booking Fee Transaction
    const dateBF = `${startYear}-${m.toString().padStart(2, '0')}-05`;
    const bfRef = `TRX-BF-${unit.unitCode}`;
    await insertTransactionWithJournal(bfRef, dateBF, `Booking Fee Unit ${unit.unitCode} a.n ${customer.name}`, 'BOOKING_FEE', 10000000, customer.id, unit.id, conf.isCash);

    if (conf.isCash) {
      // Pelunasan Cash (1 month later)
      const payMonth = m === 12 ? 1 : m + 1;
      const payYear = m === 12 ? 2026 : startYear;
      const datePay = `${payYear}-${payMonth.toString().padStart(2, '0')}-10`;
      const payRef = `TRX-PEL-${unit.unitCode}`;
      await insertTransactionWithJournal(payRef, datePay, `Pelunasan Cash Unit ${unit.unitCode} a.n ${customer.name}`, 'PELUNASAN_CASH', price - 10000000, customer.id, unit.id, true);

      // Mark all transaction as diakui
      await prisma.transaction.updateMany({
        where: { unitId: unit.id },
        data: { status_pengakuan: 'diakui' }
      });

      // Serah Terima (2 months later)
      const stMonth = m >= 11 ? m - 10 : m + 2;
      const stYear = m >= 11 ? 2026 : startYear;
      const dateST = `${stYear}-${stMonth.toString().padStart(2, '0')}-15`;
      const stRef = `BA-ST-${unit.unitCode}`;

      // Create SerahTerima record
      await prisma.serahTerima.create({
        data: {
          tenantId,
          unitId: unit.id,
          customerId: customer.id,
          date: new Date(dateST),
          handoverNo: stRef,
          notes: `Serah Terima Unit ${unit.unitCode}`,
        }
      });

      // Create manual Journal for Revenue & COGS recognition
      await createJournalWithEntries(
        stRef,
        `Pengakuan Pendapatan & HPP - ST Unit ${unit.unitCode}`,
        dateST,
        [
          { accountId: accPendMuka.id, debit: price, credit: 0, unitId: unit.id },
          { accountId: accPendPenjualan.id, debit: 0, credit: price, unitId: unit.id },
          { accountId: accHpp.id, debit: perUnitCost, credit: 0, unitId: unit.id },
          { accountId: accBdk.id, debit: 0, credit: perUnitCost, unitId: unit.id },
        ]
      );
    } else {
      // Down Payment (1 month later)
      const dpMonth = m === 12 ? 1 : m + 1;
      const dpYear = m === 12 ? 2026 : startYear;
      const dateDP = `${dpYear}-${dpMonth.toString().padStart(2, '0')}-10`;
      const dpRef = `TRX-DP-${unit.unitCode}`;
      const dpAmount = price * 0.1 - 10000000; // 10% DP minus Booking Fee
      await insertTransactionWithJournal(dpRef, dateDP, `Uang Muka Unit ${unit.unitCode} a.n ${customer.name}`, 'DOWN_PAYMENT', dpAmount, customer.id, unit.id, false);

      // Create Akad Record
      const akadMonth = m >= 11 ? m - 10 : m + 2;
      const akadYear = m >= 11 ? 2026 : startYear;
      const dateAkad = `${akadYear}-${akadMonth.toString().padStart(2, '0')}-12`;
      const akadNo = `AKAD-${unit.unitCode}`;
      const kprVal = price * 0.9;
      await prisma.unitAkad.create({
        data: {
          tenantId,
          unitId: unit.id,
          customerId: customer.id,
          tanggalAkad: new Date(dateAkad),
          namaBank: 'Bank BTN',
          nomorAkad: akadNo,
          nilaiKPR: kprVal,
        }
      });

      // Pencairan KPR (2 months later)
      const pcMonth = m >= 10 ? m - 9 : m + 3;
      const pcYear = m >= 10 ? 2026 : startYear;
      const datePC = `${pcYear}-${pcMonth.toString().padStart(2, '0')}-20`;
      const pcRef = `TRX-PC-${unit.unitCode}`;
      await insertTransactionWithJournal(pcRef, datePC, `Pencairan KPR Unit ${unit.unitCode} a.n ${customer.name}`, 'PENCAIRAN_KPR', kprVal, customer.id, unit.id, false);

      // Mark all transaction as diakui
      await prisma.transaction.updateMany({
        where: { unitId: unit.id },
        data: { status_pengakuan: 'diakui' }
      });

      // Serah Terima (3 months later)
      const stMonth = m >= 9 ? m - 8 : m + 4;
      const stYear = m >= 9 ? 2026 : startYear;
      const dateST = `${stYear}-${stMonth.toString().padStart(2, '0')}-25`;
      const stRef = `BA-ST-${unit.unitCode}`;

      // Create SerahTerima record
      await prisma.serahTerima.create({
        data: {
          tenantId,
          unitId: unit.id,
          customerId: customer.id,
          date: new Date(dateST),
          handoverNo: stRef,
          notes: `Serah Terima Unit ${unit.unitCode}`,
        }
      });

      // Create manual Journal for Revenue & COGS recognition
      await createJournalWithEntries(
        stRef,
        `Pengakuan Pendapatan & HPP - ST Unit ${unit.unitCode}`,
        dateST,
        [
          { accountId: accPendMuka.id, debit: price, credit: 0, unitId: unit.id },
          { accountId: accPendPenjualan.id, debit: 0, credit: price, unitId: unit.id },
          { accountId: accHpp.id, debit: perUnitCost, credit: 0, unitId: unit.id },
          { accountId: accBdk.id, debit: 0, credit: perUnitCost, unitId: unit.id },
        ]
      );
    }
  }
  console.log('Seeded 6 Sold & Delivered Units, created related journals, transactions, and handovers.');

  // 7. Setup 5 Booked Units (BOOKING / INDENT)
  // We choose units: GA3-A-04, GA3-A-05, GA3-B-04, GA3-B-05, GA3-A-06
  // Assign to Customers: Bambang (6), Wahyu (7), Sri (8), Agung (9), Budi (10)
  const bookedConfigs = [
    { unitIndex: 12, customerIndex: 6, bookingDate: '2026-03-10', dpDate: '2026-04-12', status: 'INDENT', isCash: false },
    { unitIndex: 14, customerIndex: 7, bookingDate: '2026-04-05', dpDate: '2026-05-08', status: 'INDENT', isCash: true },
    { unitIndex: 16, customerIndex: 8, bookingDate: '2026-05-15', dpDate: null, status: 'BOOKING', isCash: false },
    { unitIndex: 18, customerIndex: 9, bookingDate: '2026-06-02', dpDate: null, status: 'BOOKING', isCash: true },
    { unitIndex: 20, customerIndex: 10, bookingDate: '2026-06-20', dpDate: null, status: 'BOOKING', isCash: false },
  ];

  for (const conf of bookedConfigs) {
    const unit = units[conf.unitIndex];
    const customer = customers[conf.customerIndex];
    const price = Number(unit.price);

    // Link customer to unit
    await prisma.unit.update({
      where: { id: unit.id },
      data: { customerId: customer.id, status: conf.status }
    });

    // Booking Fee Transaction
    const bfRef = `TRX-BF-${unit.unitCode}`;
    await insertTransactionWithJournal(bfRef, conf.bookingDate, `Booking Fee Unit ${unit.unitCode} a.n ${customer.name}`, 'BOOKING_FEE', 10000000, customer.id, unit.id, conf.isCash);

    if (conf.dpDate) {
      // DP Transaction
      const dpRef = `TRX-DP-${unit.unitCode}`;
      const dpAmount = price * 0.1 - 10000000;
      await insertTransactionWithJournal(dpRef, conf.dpDate, `Down Payment Unit ${unit.unitCode} a.n ${customer.name}`, 'DOWN_PAYMENT', dpAmount, customer.id, unit.id, conf.isCash);
    }
  }
  console.log('Seeded 5 Booked Units and related payments.');

  // 8. Setup Monthly Expenses & Salaries (October 2025 - July 2026)
  // We pay salaries around 2nd-5th of each month, last one on July 2, 2026.
  // We pay operational costs on 10th of each month.
  // We pay marketing costs on 15th of each month.
  // We pay construction costs on 25th of each month (total cost = Rp 1.500.000.000 over 10 months = Rp 150.000.000/mo).

  const expensePeriods = [
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
    { year: 2026, month: 4 },
    { year: 2026, month: 5 },
    { year: 2026, month: 6 },
    { year: 2026, month: 7 }, // July 2026
  ];

  for (const per of expensePeriods) {
    const yr = per.year;
    const mo = per.month;
    const moStr = mo.toString().padStart(2, '0');

    // Salary (Biaya Gaji) - Rp 15.000.000
    const salDate = `${yr}-${moStr}-02`;
    const salRef = `TRX-EXP-SAL-${yr}-${moStr}`;
    await insertTransactionWithJournal(salRef, salDate, `Gaji Karyawan Bulan ${moStr}/${yr}`, 'BIAYA_GAJI', 15000000, null, null);

    // Office Operational (Biaya Operasional) - Rp 4.000.000
    const opsDate = `${yr}-${moStr}-10`;
    const opsRef = `TRX-EXP-OPS-${yr}-${moStr}`;
    await insertTransactionWithJournal(opsRef, opsDate, `Biaya Operasional Kantor Bulan ${moStr}/${yr}`, 'BIAYA_OPERASIONAL', 4000000, null, null);

    // Marketing (Biaya Marketing) - Rp 3.000.000
    const mktDate = `${yr}-${moStr}-15`;
    const mktRef = `TRX-EXP-MKT-${yr}-${moStr}`;
    await insertTransactionWithJournal(mktRef, mktDate, `Biaya Promosi dan Brosur Proyek Bulan ${moStr}/${yr}`, 'BIAYA_MARKETING', 3000000, null, null);

    // Construction Cost (Biaya Konstruksi) - Rp 150.000.000
    // Skip construction in July 2026 (assuming construction ends by June)
    if (mo !== 7) {
      const consDate = `${yr}-${moStr}-25`;
      const consRef = `TRX-EXP-CONS-${yr}-${moStr}`;
      await insertTransactionWithJournal(consRef, consDate, `Pembayaran Kontraktor Fisik Bangunan Tahap ${mo}/${yr}`, 'BIAYA_KONSTRUKSI', 150000000, null, null);
    }
  }

  console.log('Seeded Monthly Expenses (Salaries, Marketing, Operations, Construction) from Oct 2025 to July 2026.');
  console.log('Seed process successfully completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
