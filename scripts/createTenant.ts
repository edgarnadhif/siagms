import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🏁 Creating initial tenant and admin user...')

  // Check if tenant already exists
  const existingTenant = await prisma.tenant.findFirst({
    where: { slug: 'cv-griya-mandiri-sejahtera' },
  })

  let tenantId: string

  if (existingTenant) {
    console.log(`Tenant CV. Griya Mandiri Sejahtera already exists with ID: ${existingTenant.id}`)
    tenantId = existingTenant.id
  } else {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'CV. Griya Mandiri Sejahtera',
        slug: 'cv-griya-mandiri-sejahtera',
      },
    })
    console.log(`✅ Tenant created with ID: ${tenant.id}`)
    tenantId = tenant.id
  }

  // Create admin user
  const email = 'edgarndf345@gmail.com'
  const password = '@Yourname157!'
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await prisma.user.findFirst({
    where: { email },
  })

  if (existingUser) {
    console.log(`Admin user ${email} already exists.`)
  } else {
    const user = await prisma.user.create({
      data: {
        tenantId,
        email,
        password: hashedPassword,
        fullName: 'Edgar Nadhif',
        role: 'ADMIN',
      },
    })
    console.log(`✅ Admin user created with ID: ${user.id}`)
  }
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
