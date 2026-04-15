const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const entries = await prisma.journalEntry.findMany({
    where: { account: { code: '2100' } },
    include: { 
      journal: { 
        include: { transaction: { 
          include: { unit: { 
            include: { project: true } 
          }}
        }}
      } 
    },
    orderBy: { journal: { date: 'asc' } }
  })
  
  entries.forEach(e => {
    console.log({
      ref: e.journal.referenceNo,
      proyek: e.journal.transaction?.unit?.project?.name ?? 'no project',
      debit: e.debit,
      kredit: e.kredit
    })
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
