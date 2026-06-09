import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Account templates — mirrors lib/journal-mappings.ts DEFAULT_JOURNAL_ACCOUNTS
const ACCOUNT_TEMPLATES = [
  { code: '1100', name: 'Kas', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1200', name: 'Bank', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1500', name: 'Persediaan Unit Siap Jual', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1600', name: 'Biaya Dalam Pembuatan (BDK)', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '1700', name: 'Tanah', type: 'ASET', normalBalance: 'DEBIT' },
  { code: '2100', name: 'Pendapatan Diterima di Muka', type: 'KEWAJIBAN', normalBalance: 'KREDIT' },
  { code: '4100', name: 'Pendapatan Penjualan Unit', type: 'PENDAPATAN', normalBalance: 'KREDIT' },
  { code: '4200', name: 'Pendapatan Lain-lain', type: 'PENDAPATAN', normalBalance: 'KREDIT' },
  { code: '5100', name: 'Harga Pokok Penjualan', type: 'BEBAN', normalBalance: 'DEBIT' },
  { code: '5200', name: 'Beban Konstruksi', type: 'BEBAN', normalBalance: 'DEBIT' },
  { code: '5300', name: 'Beban Marketing & Penjualan', type: 'BEBAN', normalBalance: 'DEBIT' },
  { code: '5400', name: 'Beban Gaji & Upah', type: 'BEBAN', normalBalance: 'DEBIT' },
  { code: '5500', name: 'Beban Operasional Kantor', type: 'BEBAN', normalBalance: 'DEBIT' },
  { code: '5600', name: 'Beban Lain-lain', type: 'BEBAN', normalBalance: 'DEBIT' },
] as const;

// All 10 mapping categories with their default debit/credit account codes
const MAPPING_DEFS = [
  { category: 'BOOKING_FEE', description: 'Booking Fee', debitCode: '1200', creditCode: '2100' },
  { category: 'DOWN_PAYMENT', description: 'Down Payment', debitCode: '1200', creditCode: '2100' },
  { category: 'ANGSURAN_KPR', description: 'Angsuran KPR', debitCode: '1200', creditCode: '2100' },
  { category: 'PENCAIRAN_KPR', description: 'Pencairan KPR', debitCode: '1200', creditCode: '2100' },
  { category: 'PELUNASAN_CASH', description: 'Pelunasan Cash', debitCode: '1200', creditCode: '2100' },
  { category: 'BIAYA_KONSTRUKSI', description: 'Biaya Konstruksi (BDK)', debitCode: '1600', creditCode: '1200' },
  { category: 'BIAYA_MARKETING', description: 'Biaya Marketing', debitCode: '5300', creditCode: '1200' },
  { category: 'BIAYA_GAJI', description: 'Biaya Gaji', debitCode: '5400', creditCode: '1200' },
  { category: 'BIAYA_OPERASIONAL', description: 'Biaya Operasional', debitCode: '5500', creditCode: '1200' },
  { category: 'LAIN_LAIN', description: 'Lain-lain', debitCode: '5600', creditCode: '1200' },
] as const;

async function ensureAccount(tenantId: string, template: typeof ACCOUNT_TEMPLATES[number]) {
  const existing = await prisma.account.findFirst({
    where: { tenantId, code: template.code },
  });
  if (existing) return existing;

  return prisma.account.create({
    data: {
      tenantId,
      code: template.code,
      name: template.name,
      type: template.type as any,
      normalBalance: template.normalBalance as any,
      isActive: true,
      isSystem: true,
    },
  });
}

async function main() {
  console.log('🔧 Seeding journal mappings...\n')

  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } })

  if (tenants.length === 0) {
    console.log('⚠️ No tenants found. Run tenant setup first.')
    return
  }

  for (const tenant of tenants) {
    console.log(`📦 Tenant: ${tenant.name} (${tenant.id})`)

    // 1. Ensure all required accounts exist for this tenant
    const accountMap = new Map<string, string>() // code -> id
    for (const tpl of ACCOUNT_TEMPLATES) {
      const acc = await ensureAccount(tenant.id, tpl)
      accountMap.set(tpl.code, acc.id)
    }
    console.log(`   ✅ Ensured ${ACCOUNT_TEMPLATES.length} default accounts exist`)

    // 2. Create/update all 10 journal mappings
    let created = 0
    let updated = 0
    for (const def of MAPPING_DEFS) {
      const debitAccountId = accountMap.get(def.debitCode)
      const creditAccountId = accountMap.get(def.creditCode)

      if (!debitAccountId || !creditAccountId) {
        console.log(`   ⚠️ Skipping ${def.category}: missing account (debit=${def.debitCode}, credit=${def.creditCode})`)
        continue
      }

      const existing = await prisma.journalMapping.findFirst({
        where: { tenantId: tenant.id, category: def.category },
      })

      await prisma.journalMapping.upsert({
        where: {
          tenantId_category: {
            tenantId: tenant.id,
            category: def.category,
          },
        },
        update: {
          description: def.description,
          debitAccountId,
          creditAccountId,
        },
        create: {
          tenantId: tenant.id,
          category: def.category,
          description: def.description,
          debitAccountId,
          creditAccountId,
          isActive: true,
        },
      })

      if (existing) {
        updated++
        console.log(`   🔄 ${def.category} → updated`)
      } else {
        created++
        console.log(`   ✅ ${def.category} → created`)
      }
    }

    console.log(`   📊 Done: ${created} created, ${updated} updated\n`)
  }

  console.log('🎉 Journal mapping berhasil di-seed!')
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
