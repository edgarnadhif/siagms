import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function main() {
  try {
    console.log('Attempting to connect to database...')
    await prisma.$connect()
    console.log('Connection successful!')
    
    const count = await prisma.user.count()
    console.log(`Found ${count} users in database.`)
    
    await prisma.$disconnect()
  } catch (e) {
    console.error('Connection failed:')
    console.error(e)
    process.exit(1)
  }
}

main()
