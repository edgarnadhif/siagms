import { PrismaClient, UnitStatus, PaymentMethod, TransactionCategory, SkemaPembayaran, SumberPembayaran, StatusPengakuan } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting realistic dummy data seeding for Griya Azzahra 4...')

  // 1. Fetch Tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'cv-griya-mandiri-sejahtera' },
  })
  if (!tenant) {
    throw new Error('Tenant CV. Griya Mandiri Sejahtera not found. Run createTenant first!')
  }
  const tenantId = tenant.id

  // 2. Fetch Accounts needed for Journals
  const bankAcc = await prisma.account.findFirst({ where: { tenantId, code: '1200' } })
  const pMukaAcc = await prisma.account.findFirst({ where: { tenantId, code: '2100' } })
  const pendAcc = await prisma.account.findFirst({ where: { tenantId, code: '4100' } })
  const hppAcc = await prisma.account.findFirst({ where: { tenantId, code: '5100' } })
  const bdkAcc = await prisma.account.findFirst({ where: { tenantId, code: '1600' } })
  const bebanKonstruksiAcc = await prisma.account.findFirst({ where: { tenantId, code: '5200' } })

  if (!bankAcc || !pMukaAcc || !pendAcc || !hppAcc || !bdkAcc || !bebanKonstruksiAcc) {
    throw new Error('Some system accounts are missing. Run seedJournalMapping first!')
  }

  // 3. Create Project
  const projectCode = 'PRJ-GA4'
  const existingProject = await prisma.project.findFirst({
    where: { tenantId, code: projectCode },
  })
  if (existingProject) {
    console.log('Project Griya Azzahra 4 already exists. Cleaning up project units and data first...')
    // Cascade delete project transactions, units, journals etc.
    const projectUnits = await prisma.unit.findMany({ where: { tenantId, projectId: existingProject.id } })
    const unitIds = projectUnits.map(u => u.id)

    await prisma.journalEntry.deleteMany({ where: { tenantId, projectId: existingProject.id } })
    await prisma.serahTerima.deleteMany({ where: { tenantId, unitId: { in: unitIds } } })
    await prisma.transaction.deleteMany({ where: { tenantId, projectId: existingProject.id } })
    await prisma.unit.deleteMany({ where: { tenantId, projectId: existingProject.id } })
    await prisma.project.delete({ where: { id: existingProject.id } })
  }

  const project = await prisma.project.create({
    data: {
      tenantId,
      code: projectCode,
      name: 'Griya Azzahra 4',
      description: 'Proyek Perumahan Subsidi & Komersil di daerah Purwokerto.',
      location: 'Purwokerto, Banyumas',
      startDate: new Date('2026-01-01'),
      budget: 5000000000,
    },
  })
  console.log(`✅ Project created: ${project.name} (${project.id})`)

  // Helper function to create a transaction and its journal entries
  async function createTrx(params: {
    reference: string
    date: Date
    description: string
    category: TransactionCategory
    amount: number
    customerId?: string
    unitId?: string
    skema: SkemaPembayaran
    statusPengakuan: StatusPengakuan
    debitAccId: string
    creditAccId: string
  }) {
    // 1. Create Transaction
    const trx = await prisma.transaction.create({
      data: {
        tenantId,
        projectId: project.id,
        unitId: params.unitId,
        customerId: params.customerId,
        reference: params.reference,
        date: params.date,
        description: params.description,
        category: params.category,
        amount: params.amount,
        skema_pembayaran: params.skema,
        status_pengakuan: params.statusPengakuan,
        sumber_pembayaran: params.category === 'PENCAIRAN_KPR' ? 'bank_kpr' : 'pembeli',
        kwitansiNo: params.reference.replace('TRX', 'KWT'),
        kwitansiDate: params.date,
      },
    })

    // 2. Create Journal Header
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        referenceNo: trx.kwitansiNo!,
        description: `Jurnal Otomatis - ${params.description}`,
        date: params.date,
      },
    })

    // 3. Create Journal Entries (Debit & Credit)
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: journal.id,
          reference: trx.kwitansiNo!,
          date: params.date,
          description: params.description,
          accountId: params.debitAccId,
          debit: params.amount,
          credit: 0,
          isAuto: true,
          projectId: project.id,
          unitId: params.unitId || null,
          transactionId: trx.id,
        },
        {
          tenantId,
          journalId: journal.id,
          reference: trx.kwitansiNo!,
          date: params.date,
          description: params.description,
          accountId: params.creditAccId,
          debit: 0,
          credit: params.amount,
          isAuto: true,
          projectId: project.id,
          unitId: params.unitId || null,
          transactionId: trx.id,
        },
      ],
    })

    return trx
  }

  // 4. Seed Project Construction Cost (Rp 1.36 Billion total / Rp 40 Million per unit cost of goods sold)
  console.log('🔧 Seeding construction cost transaction...')
  const constDate = new Date('2026-02-15')
  const totalCost = 1360000000 // 1.36 Billion
  const costJournal = await prisma.journal.create({
    data: {
      tenantId,
      referenceNo: 'KWT-KONSTRUKSI-001',
      description: 'Pencatatan Biaya Konstruksi Griya Azzahra 4',
      date: constDate,
    },
  })
  const constTrx = await prisma.transaction.create({
    data: {
      tenantId,
      projectId: project.id,
      reference: 'TRX-KONSTRUKSI-001',
      date: constDate,
      description: 'Pembayaran Biaya Konstruksi Sipil 34 Unit Perumahan',
      category: TransactionCategory.BIAYA_KONSTRUKSI,
      amount: totalCost,
      skema_pembayaran: SkemaPembayaran.cash,
      status_pengakuan: StatusPengakuan.diakui,
      sumber_pembayaran: SumberPembayaran.pembeli,
      kwitansiNo: 'KWT-KONSTRUKSI-001',
      kwitansiDate: constDate,
    },
  })
  await prisma.journalEntry.createMany({
    data: [
      {
        tenantId,
        journalId: costJournal.id,
        reference: 'KWT-KONSTRUKSI-001',
        date: constDate,
        description: 'Pembayaran Biaya Konstruksi Griya Azzahra 4',
        accountId: bdkAcc.id, // BDK (ASET)
        debit: totalCost,
        credit: 0,
        isAuto: true,
        projectId: project.id,
        transactionId: constTrx.id,
      },
      {
        tenantId,
        journalId: costJournal.id,
        reference: 'KWT-KONSTRUKSI-001',
        date: constDate,
        description: 'Pembayaran Biaya Konstruksi Griya Azzahra 4',
        accountId: bankAcc.id, // Kredit Bank
        debit: 0,
        credit: totalCost,
        isAuto: true,
        projectId: project.id,
        transactionId: constTrx.id,
      },
    ],
  })

  // 5. Generate 34 Units
  console.log('🔧 Generating 34 units...')
  const unitsData: any[] = []
  
  // Block A: 12 Units (Tipe 36/72 - Rp 350.000.000)
  for (let i = 1; i <= 12; i++) {
    const num = i.toString().padStart(2, '0')
    unitsData.push({
      unitCode: `A-${num}`,
      blockName: 'Blok A',
      unitNumber: num,
      type: 'Tipe 36/72',
      landArea: 72,
      buildingArea: 36,
      price: 350000000,
    })
  }

  // Block B: 12 Units (Tipe 45/90 - Rp 450.000.000)
  for (let i = 1; i <= 12; i++) {
    const num = i.toString().padStart(2, '0')
    unitsData.push({
      unitCode: `B-${num}`,
      blockName: 'Blok B',
      unitNumber: num,
      type: 'Tipe 45/90',
      landArea: 90,
      buildingArea: 45,
      price: 450000000,
    })
  }

  // Block C: 10 Units (Tipe 54/120 - Rp 550.000.000)
  for (let i = 1; i <= 10; i++) {
    const num = i.toString().padStart(2, '0')
    unitsData.push({
      unitCode: `C-${num}`,
      blockName: 'Blok C',
      unitNumber: num,
      type: 'Tipe 54/120',
      landArea: 120,
      buildingArea: 54,
      price: 550000000,
    })
  }

  const unitsMap = new Map<string, string>() // unitCode -> id
  for (const u of unitsData) {
    const unit = await prisma.unit.create({
      data: {
        tenantId,
        projectId: project.id,
        unitCode: u.unitCode,
        blockName: u.blockName,
        unitNumber: u.unitNumber,
        type: u.type,
        landArea: u.landArea,
        buildingArea: u.buildingArea,
        price: u.price,
        status: UnitStatus.TERSEDIA,
      },
    })
    unitsMap.set(u.unitCode, unit.id)
  }
  console.log(`✅ Generated 34 units in Griya Azzahra 4`)

  // 6. Seed 5 Occupied (Handed Over / SERAH_TERIMA) Units
  console.log('🔧 Seeding 5 occupied (Serah Terima) units with full historical data...')
  
  const occupiedConfigs = [
    {
      unitCode: 'A-01',
      custCode: 'PLG-001',
      name: 'Budi Santoso',
      nik: '3302011111110001',
      phone: '081234567001',
      email: 'budi.santoso@email.com',
      address: 'Jl. Pemuda No. 12, Purwokerto',
      paymentMethod: PaymentMethod.CASH,
      skema: SkemaPembayaran.cash,
      price: 350000000,
      bf: 5000000,
      dp: 70000000,
      lunas: 275000000,
    },
    {
      unitCode: 'A-02',
      custCode: 'PLG-002',
      name: 'Siti Rahmawati',
      nik: '3302012222220002',
      phone: '081234567002',
      email: 'siti.rahma@email.com',
      address: 'Jl. Jenderal Sudirman No. 45, Banyumas',
      paymentMethod: PaymentMethod.KPR,
      skema: SkemaPembayaran.kpr,
      price: 350000000,
      bf: 5000000,
      dp: 70000000,
      lunas: 275000000, // KPR Pencairan
      bank: 'Bank BTN',
    },
    {
      unitCode: 'B-01',
      custCode: 'PLG-003',
      name: 'Ahmad Hidayat',
      nik: '3302013333330003',
      phone: '081234567003',
      email: 'ahmad.hid@email.com',
      address: 'Perum Sapphire Regensi Blok D-10, Purwokerto',
      paymentMethod: PaymentMethod.CASH,
      skema: SkemaPembayaran.cash,
      price: 450000000,
      bf: 5000000,
      dp: 95000000,
      lunas: 350000000,
    },
    {
      unitCode: 'B-02',
      custCode: 'PLG-004',
      name: 'Dewi Lestari',
      nik: '3302014444440004',
      phone: '081234567004',
      email: 'dewi.lestari@email.com',
      address: 'Jl. HR Boenyamin No. 8, Purwokerto',
      paymentMethod: PaymentMethod.KPR,
      skema: SkemaPembayaran.kpr,
      price: 450000000,
      bf: 5000000,
      dp: 95000000,
      lunas: 350000000, // KPR Pencairan
      bank: 'Bank Mandiri',
    },
    {
      unitCode: 'C-01',
      custCode: 'PLG-005',
      name: 'Eko Prasetyo',
      nik: '3302015555550005',
      phone: '081234567005',
      email: 'eko.pras@email.com',
      address: 'Jl. Gerilya No. 120, Purwokerto Selatan',
      paymentMethod: PaymentMethod.KPR,
      skema: SkemaPembayaran.kpr,
      price: 550000000,
      bf: 5000000,
      dp: 115000000,
      lunas: 430000000, // KPR Pencairan
      bank: 'Bank BNI',
    },
  ]

  let trxIndex = 1
  for (const cfg of occupiedConfigs) {
    const unitId = unitsMap.get(cfg.unitCode)!
    
    // 1. Create Customer
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        customerCode: cfg.custCode,
        name: cfg.name,
        nik: cfg.nik,
        phone: cfg.phone,
        email: cfg.email,
        address: cfg.address,
        paymentMethod: cfg.paymentMethod,
        bankName: cfg.bank || null,
        kprAmount: cfg.paymentMethod === PaymentMethod.KPR ? cfg.lunas : null,
        kprTenor: cfg.paymentMethod === PaymentMethod.KPR ? 15 : null,
      },
    })

    // 2. Link Customer to Unit
    await prisma.unit.update({
      where: { id: unitId },
      data: { customerId: customer.id, status: UnitStatus.SERAH_TERIMA },
    })

    // Dates for historical timeline
    const dateBF = new Date('2026-03-01T08:00:00Z')
    const dateDP = new Date('2026-03-15T09:00:00Z')
    const dateLunas = new Date('2026-04-10T10:00:00Z')
    const dateST = new Date('2026-05-01T11:00:00Z')

    // 3. Booking Fee
    const refBF = `TRX-${trxIndex.toString().padStart(4, '0')}`
    trxIndex++
    await createTrx({
      reference: refBF,
      date: dateBF,
      description: `Kwitansi Uang Tanda Jadi (Booking Fee) Unit ${cfg.unitCode} - ${cfg.name}`,
      category: TransactionCategory.BOOKING_FEE,
      amount: cfg.bf,
      customerId: customer.id,
      unitId,
      skema: cfg.skema,
      statusPengakuan: StatusPengakuan.diakui,
      debitAccId: bankAcc.id,
      creditAccId: pMukaAcc.id,
    })

    // 4. Down Payment
    const refDP = `TRX-${trxIndex.toString().padStart(4, '0')}`
    trxIndex++
    await createTrx({
      reference: refDP,
      date: dateDP,
      description: `Kwitansi Pembayaran Uang Muka (DP) Unit ${cfg.unitCode} - ${cfg.name}`,
      category: TransactionCategory.DOWN_PAYMENT,
      amount: cfg.dp,
      customerId: customer.id,
      unitId,
      skema: cfg.skema,
      statusPengakuan: StatusPengakuan.diakui,
      debitAccId: bankAcc.id,
      creditAccId: pMukaAcc.id,
    })

    // 5. Pelunasan Cash / Pencairan KPR
    const refLunas = `TRX-${trxIndex.toString().padStart(4, '0')}`
    trxIndex++
    const isKPR = cfg.paymentMethod === PaymentMethod.KPR
    await createTrx({
      reference: refLunas,
      date: dateLunas,
      description: isKPR 
        ? `Kwitansi Pencairan Akad KPR ${cfg.bank} Unit ${cfg.unitCode} - ${cfg.name}`
        : `Kwitansi Pelunasan Cash Unit ${cfg.unitCode} - ${cfg.name}`,
      category: isKPR ? TransactionCategory.PENCAIRAN_KPR : TransactionCategory.PELUNASAN_CASH,
      amount: cfg.lunas,
      customerId: customer.id,
      unitId,
      skema: cfg.skema,
      statusPengakuan: StatusPengakuan.diakui,
      debitAccId: bankAcc.id,
      creditAccId: pMukaAcc.id,
    })

    // 6. Serah Terima (Handover) Record
    const handoverNo = `ST-${cfg.unitCode.replace('-', '')}-${Date.now().toString().slice(-4)}`
    await prisma.serahTerima.create({
      data: {
        tenantId,
        handoverNo,
        date: dateST,
        unitId,
        customerId: customer.id,
        notes: `Serah Terima unit ${cfg.unitCode} tipe ${cfg.unitCode.startsWith('A') ? '36' : cfg.unitCode.startsWith('B') ? '45' : '54'} ke ${cfg.name}. Pembangunan selesai dan pembayaran lunas.`,
      },
    })

    // 7. Revenue Recognition Journal entries (PMUKA -> Pendapatan Penjualan)
    const stJournal = await prisma.journal.create({
      data: {
        tenantId,
        referenceNo: handoverNo,
        description: `Pengakuan Pendapatan - ST Unit ${cfg.unitCode} - ${cfg.name}`,
        date: dateST,
      },
    })
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: stJournal.id,
          reference: handoverNo,
          date: dateST,
          description: `Pengakuan Pendapatan - ST Unit ${cfg.unitCode} - ${cfg.name}`,
          accountId: pMukaAcc.id, // Debit PMUKA (Mengurangi kewajiban)
          debit: cfg.price,
          credit: 0,
          isAuto: true,
          projectId: project.id,
          unitId,
        },
        {
          tenantId,
          journalId: stJournal.id,
          reference: handoverNo,
          date: dateST,
          description: `Pengakuan Pendapatan - ST Unit ${cfg.unitCode} - ${cfg.name}`,
          accountId: pendAcc.id, // Kredit Pendapatan Penjualan
          debit: 0,
          credit: cfg.price,
          isAuto: true,
          projectId: project.id,
          unitId,
        },
      ],
    })

    // 8. Cost of Goods Sold Recognition (HPP -> BDK)
    // HPP = Total Konstruksi (1.36 Billion) / 34 units = 40.000.000 per unit
    const hppCost = 40000000 
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: stJournal.id,
          reference: handoverNo,
          date: dateST,
          description: `Pengakuan HPP - ST Unit ${cfg.unitCode}`,
          accountId: hppAcc.id, // Debit Beban HPP
          debit: hppCost,
          credit: 0,
          isAuto: true,
          projectId: project.id,
          unitId,
        },
        {
          tenantId,
          journalId: stJournal.id,
          reference: handoverNo,
          date: dateST,
          description: `Pengakuan HPP - ST Unit ${cfg.unitCode}`,
          accountId: bdkAcc.id, // Kredit BDK (Mengurangi persediaan aset konstruksi)
          debit: 0,
          credit: hppCost,
          isAuto: true,
          projectId: project.id,
          unitId,
        },
      ],
    })
  }

  // 7. Seed 3 Newly Sold (Booking / DP) Units
  console.log('🔧 Seeding 3 newly sold (booking/dp) units in progress...')
  
  const soldConfigs = [
    {
      unitCode: 'A-03', // Tipe 36 - Rp 350.000.000
      custCode: 'PLG-006',
      name: 'Rina Wijaya',
      nik: '3302016666660006',
      phone: '081234567006',
      email: 'rina.wijaya@email.com',
      address: 'Jl. Dr. Angka No. 90, Purwokerto Utara',
      paymentMethod: PaymentMethod.KPR,
      skema: SkemaPembayaran.kpr,
      bank: 'Bank BTN',
      status: UnitStatus.BOOKING,
      bf: 5000000,
    },
    {
      unitCode: 'B-03', // Tipe 45 - Rp 450.000.000
      custCode: 'PLG-007',
      name: 'Yusuf Mansur',
      nik: '3302017777770007',
      phone: '081234567007',
      email: 'yusuf.mansur@email.com',
      address: 'Sokaraja Kulon Rt 02 Rw 04, Banyumas',
      paymentMethod: PaymentMethod.CASH,
      skema: SkemaPembayaran.cash,
      status: UnitStatus.BOOKING,
      bf: 5000000,
      dp: 95000000, // Also paid DP
    },
    {
      unitCode: 'C-02', // Tipe 54 - Rp 550.000.000
      custCode: 'PLG-008',
      name: 'Linda Permata',
      nik: '3302018888880008',
      phone: '081234567008',
      email: 'linda.permata@email.com',
      address: 'Jl. Raden Patah No. 14, Purwokerto Barat',
      paymentMethod: PaymentMethod.KPR,
      skema: SkemaPembayaran.kpr,
      bank: 'Bank BNI',
      status: UnitStatus.BOOKING,
      bf: 5000000,
    },
  ]

  for (const cfg of soldConfigs) {
    const unitId = unitsMap.get(cfg.unitCode)!
    
    // 1. Create Customer
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        customerCode: cfg.custCode,
        name: cfg.name,
        nik: cfg.nik,
        phone: cfg.phone,
        email: cfg.email,
        address: cfg.address,
        paymentMethod: cfg.paymentMethod,
        bankName: cfg.bank || null,
      },
    })

    // 2. Link Customer to Unit and set to Booking
    await prisma.unit.update({
      where: { id: unitId },
      data: { customerId: customer.id, status: cfg.status },
    })

    const dateBF = new Date('2026-06-01T08:00:00Z')
    const dateDP = new Date('2026-06-05T09:00:00Z')

    // 3. Booking Fee
    const refBF = `TRX-${trxIndex.toString().padStart(4, '0')}`
    trxIndex++
    await createTrx({
      reference: refBF,
      date: dateBF,
      description: `Kwitansi Uang Tanda Jadi (Booking Fee) Unit ${cfg.unitCode} - ${cfg.name}`,
      category: TransactionCategory.BOOKING_FEE,
      amount: cfg.bf,
      customerId: customer.id,
      unitId,
      skema: cfg.skema,
      statusPengakuan: StatusPengakuan.diterima, // Belum diserahterimakan, pengakuan "diterima"
      debitAccId: bankAcc.id,
      creditAccId: pMukaAcc.id,
    })

    // 4. DP (if paid in config)
    if (cfg.dp) {
      const refDP = `TRX-${trxIndex.toString().padStart(4, '0')}`
      trxIndex++
      await createTrx({
        reference: refDP,
        date: dateDP,
        description: `Kwitansi Uang Muka (DP) Unit ${cfg.unitCode} - ${cfg.name}`,
        category: TransactionCategory.DOWN_PAYMENT,
        amount: cfg.dp,
        customerId: customer.id,
        unitId,
        skema: cfg.skema,
        statusPengakuan: StatusPengakuan.diterima,
        debitAccId: bankAcc.id,
        creditAccId: pMukaAcc.id,
      })
    }
  }

  console.log('🎉 Seeding completed successfully!')
  console.log('Summary:')
  console.log('- Created 1 Project: Griya Azzahra 4')
  console.log('- Seeded 1 Construction Cost transaction: Rp 1.360.000.000')
  console.log('- Seeded 34 Units (A-01 to A-12, B-01 to B-12, C-01 to C-10)')
  console.log('- Seeded 5 Occupied (SERAH_TERIMA) Units (A-01, A-02, B-01, B-02, C-01) with full transaction history and handovers')
  console.log('- Seeded 3 Newly Sold (BOOKING) Units (A-03, B-03, C-02) with active transactions')
  console.log('- Left 26 Available (TERSEDIA) Units')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
