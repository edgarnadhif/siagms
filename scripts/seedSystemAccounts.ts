import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const systemAccountCodes = [
  '1200', // Bank
  '2100', // Pendapatan Diterima di Muka
  '4100', // Pendapatan Penjualan Unit
  '5200', // Beban Konstruksi
  '5300', // Beban Marketing
  '5400', // Beban Gaji
  '5500', // Beban Operasional
  '5600', // Beban Lain-lain
]

async function main() {
  console.log('🔧 Marking system accounts...')

  const result = await prisma.account.updateMany({
    where: { code: { in: systemAccountCodes } },
    data: { isSystem: true },
  })

  console.log(`✅ ${result.count} akun ditandai sebagai akun sistem.`)

  // Verify
  const systemAccounts = await prisma.account.findMany({
    where: { isSystem: true },
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  })

  console.log('\n📋 Akun Sistem:')
  systemAccounts.forEach((acc) => {
    console.log(`   ${acc.code} - ${acc.name}`)
  })
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
