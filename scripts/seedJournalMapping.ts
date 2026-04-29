import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔧 Seeding journal mappings...')

  // Get all tenants
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } })

  for (const tenant of tenants) {
    console.log(`\n📦 Tenant: ${tenant.name} (${tenant.id})`)

    // Fetch accounts for this tenant
    const bank = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '1200' } })
    const pdm = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '2100' } })
    const penjualan = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '4100' } })
    const konstruksi = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '5200' } })
    const marketing = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '5300' } })
    const gaji = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '5400' } })
    const operasional = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '5500' } })
    const lainlain = await prisma.account.findFirst({ where: { tenantId: tenant.id, code: '5600' } })

    if (!bank || !pdm) {
      console.log(`   ⚠️ Skipping tenant ${tenant.name}: akun Bank (1200) atau PDM (2100) tidak ditemukan.`)
      continue
    }

    // For expense categories, use the specific account or fallback to operasional or bank
    const mappings = [
      {
        category: 'BOOKING_FEE',
        description: 'Booking Fee',
        debitAccountId: bank.id,
        creditAccountId: pdm.id,
      },
      {
        category: 'DOWN_PAYMENT',
        description: 'Down Payment',
        debitAccountId: bank.id,
        creditAccountId: pdm.id,
      },
      {
        category: 'ANGSURAN_KPR',
        description: 'Angsuran KPR',
        debitAccountId: bank.id,
        creditAccountId: pdm.id,
      },
      {
        category: 'PENCAIRAN_KPR',
        description: 'Pencairan KPR',
        debitAccountId: bank.id,
        creditAccountId: pdm.id,
      },
      {
        category: 'PELUNASAN_CASH',
        description: 'Pelunasan Cash',
        debitAccountId: bank.id,
        creditAccountId: pdm.id,
      },
      ...(konstruksi
        ? [{
            category: 'BIAYA_KONSTRUKSI',
            description: 'Biaya Konstruksi',
            debitAccountId: konstruksi.id,
            creditAccountId: bank.id,
          }]
        : []),
      ...(marketing
        ? [{
            category: 'BIAYA_MARKETING',
            description: 'Biaya Marketing',
            debitAccountId: marketing.id,
            creditAccountId: bank.id,
          }]
        : []),
      ...(gaji
        ? [{
            category: 'BIAYA_GAJI',
            description: 'Biaya Gaji',
            debitAccountId: gaji.id,
            creditAccountId: bank.id,
          }]
        : []),
      ...(operasional
        ? [{
            category: 'BIAYA_OPERASIONAL',
            description: 'Biaya Operasional',
            debitAccountId: operasional.id,
            creditAccountId: bank.id,
          }]
        : []),
      ...(lainlain
        ? [{
            category: 'LAIN_LAIN',
            description: 'Lain-lain',
            debitAccountId: lainlain.id,
            creditAccountId: bank.id,
          }]
        : (operasional
          ? [{
              category: 'LAIN_LAIN',
              description: 'Lain-lain',
              debitAccountId: operasional.id,
              creditAccountId: bank.id,
            }]
          : [])),
    ]

    for (const mapping of mappings) {
      await prisma.journalMapping.upsert({
        where: {
          tenantId_category: {
            tenantId: tenant.id,
            category: mapping.category,
          },
        },
        update: {
          description: mapping.description,
          debitAccountId: mapping.debitAccountId,
          creditAccountId: mapping.creditAccountId,
        },
        create: {
          tenantId: tenant.id,
          ...mapping,
        },
      })
      console.log(`   ✅ ${mapping.category} → Debit: ${mapping.debitAccountId.slice(0, 8)}... | Credit: ${mapping.creditAccountId.slice(0, 8)}...`)
    }
  }

  console.log('\n🎉 Journal mapping berhasil di-seed!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
