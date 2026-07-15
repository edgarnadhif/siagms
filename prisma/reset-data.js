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
  console.log('Starting database cleaning process...');

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete Journal Entries
      const je = await tx.journalEntry.deleteMany({});
      console.log(`Deleted ${je.count} journal entries.`);

      // 2. Delete Journals
      const j = await tx.journal.deleteMany({});
      console.log(`Deleted ${j.count} journals.`);

      // 3. Delete Transactions
      const t = await tx.transaction.deleteMany({});
      console.log(`Deleted ${t.count} transactions.`);

      // 4. Delete Serah Terimas
      const st = await tx.serahTerima.deleteMany({});
      console.log(`Deleted ${st.count} serah terima records.`);

      // 5. Delete Cancellations
      const c = await tx.cancellation.deleteMany({});
      console.log(`Deleted ${c.count} cancellation records.`);

      // 6. Delete Unit Akads
      const ua = await tx.unitAkad.deleteMany({});
      console.log(`Deleted ${ua.count} unit akad records.`);

      // 7. Delete Calendar Events
      const ce = await tx.calendarEvent.deleteMany({});
      console.log(`Deleted ${ce.count} calendar events.`);

      // 8. Delete Units (removes reference to customer and project)
      const u = await tx.unit.deleteMany({});
      console.log(`Deleted ${u.count} units.`);

      // 9. Delete Customers
      const cust = await tx.customer.deleteMany({});
      console.log(`Deleted ${cust.count} customers.`);

      // 10. Delete Projects
      const p = await tx.project.deleteMany({});
      console.log(`Deleted ${p.count} projects.`);

      console.log('Database successfully cleared of operational data. User, Tenant, CompanyProfile, CompanySettings, Account, and JournalMapping are preserved!');
    });
  } catch (error) {
    console.error('Error executing transaction:', error);
    throw error;
  }
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
