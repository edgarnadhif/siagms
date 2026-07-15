const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('=== DATA COUNT IN DATABASE ===');
  
  const tables = [
    'tenant',
    'user',
    'companyProfile',
    'companySettings',
    'project',
    'account',
    'transaction',
    'journal',
    'journalEntry',
    'customer',
    'unit',
    'serahTerima',
    'cancellation',
    'unitAkad',
    'calendarEvent',
    'journalMapping'
  ];

  for (const table of tables) {
    try {
      const count = await prisma[table].count();
      console.log(`${table}: ${count} rows`);
    } catch (e) {
      console.log(`${table}: Error counting (${e.message})`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
