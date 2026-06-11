import { PrismaClient, TransactionCategory, SkemaPembayaran, SumberPembayaran, StatusPengakuan } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔧 Adding more expense categories for Griya Azzahra 4...')

  // 1. Fetch Tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'cv-griya-mandiri-sejahtera' },
  })
  if (!tenant) throw new Error('Tenant not found')
  const tenantId = tenant.id

  // 2. Fetch Project
  const project = await prisma.project.findFirst({
    where: { tenantId, code: 'PRJ-GA4' },
  })
  if (!project) throw new Error('Project PRJ-GA4 not found')

  // 3. Fetch Accounts
  const bankAcc = await prisma.account.findFirst({ where: { tenantId, code: '1200' } })
  const marketingAcc = await prisma.account.findFirst({ where: { tenantId, code: '5300' } })
  const gajiAcc = await prisma.account.findFirst({ where: { tenantId, code: '5400' } })
  const operasionalAcc = await prisma.account.findFirst({ where: { tenantId, code: '5500' } })
  const lainAcc = await prisma.account.findFirst({ where: { tenantId, code: '5600' } })

  if (!bankAcc || !marketingAcc || !gajiAcc || !operasionalAcc || !lainAcc) {
    throw new Error('Some expense accounts are missing in the database!')
  }

  // Helper function to create transaction & journals
  async function addExpense(params: {
    reference: string
    date: Date
    description: string
    category: TransactionCategory
    amount: number
    expenseAccId: string
  }) {
    // 1. Transaction
    const trx = await prisma.transaction.create({
      data: {
        tenantId,
        projectId: project.id,
        reference: params.reference,
        date: params.date,
        description: params.description,
        category: params.category,
        amount: params.amount,
        skema_pembayaran: SkemaPembayaran.cash,
        status_pengakuan: StatusPengakuan.diakui,
        sumber_pembayaran: SumberPembayaran.pembeli,
        kwitansiNo: params.reference.replace('TRX', 'KWT'),
        kwitansiDate: params.date,
      },
    })

    // 2. Journal Header
    const journal = await prisma.journal.create({
      data: {
        tenantId,
        referenceNo: trx.kwitansiNo!,
        description: `Jurnal Otomatis - ${params.description}`,
        date: params.date,
      },
    })

    // 3. Journal Entries
    await prisma.journalEntry.createMany({
      data: [
        {
          tenantId,
          journalId: journal.id,
          reference: trx.kwitansiNo!,
          date: params.date,
          description: params.description,
          accountId: params.expenseAccId, // Debit Beban
          debit: params.amount,
          credit: 0,
          isAuto: true,
          projectId: project.id,
          transactionId: trx.id,
        },
        {
          tenantId,
          journalId: journal.id,
          reference: trx.kwitansiNo!,
          date: params.date,
          description: params.description,
          accountId: bankAcc.id, // Kredit Bank
          debit: 0,
          credit: params.amount,
          isAuto: true,
          projectId: project.id,
          transactionId: trx.id,
        },
      ],
    })

    console.log(`✅ Expense added: ${params.description} (Rp ${params.amount})`)
  }

  // Insert diverse expenses
  const baseDate = new Date('2026-04-15')

  await addExpense({
    reference: 'TRX-BEBAN-001',
    date: baseDate,
    description: 'Pembayaran Gaji Pengawas Lapangan dan Tukang Tahap 1',
    category: TransactionCategory.BIAYA_GAJI,
    amount: 45000000, // Rp 45 Juta
    expenseAccId: gajiAcc.id,
  })

  await addExpense({
    reference: 'TRX-BEBAN-002',
    date: new Date('2026-04-20'),
    description: 'Biaya Cetak Brosur & Pasang Baliho Promosi Perumahan',
    category: TransactionCategory.BIAYA_MARKETING,
    amount: 25000000, // Rp 25 Juta
    expenseAccId: marketingAcc.id,
  })

  await addExpense({
    reference: 'TRX-BEBAN-003',
    date: new Date('2026-04-25'),
    description: 'Pembayaran Rekening Listrik, Air & Internet Kantor Pemasaran',
    category: TransactionCategory.BIAYA_OPERASIONAL,
    amount: 15000000, // Rp 15 Juta
    expenseAccId: operasionalAcc.id,
  })

  await addExpense({
    reference: 'TRX-BEBAN-004',
    date: new Date('2026-05-10'),
    description: 'Pembayaran Biaya Perizinan Lingkungan & Lain-lain',
    category: TransactionCategory.LAIN_LAIN,
    amount: 5000000, // Rp 5 Juta
    expenseAccId: lainAcc.id,
  })

  console.log('🎉 Additional expenses seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
