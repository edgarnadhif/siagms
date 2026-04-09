// @ts-nocheck
import "dotenv/config";
const { prisma } = await import("../lib/db.ts");

async function main() {
  const journals = await prisma.journal.findMany({
    where: {
      referenceNo: {
        startsWith: "BA-ST/",
      },
    },
    include: {
      entries: {
        include: {
          account: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  console.log(`Ditemukan ${journals.length} jurnal serah terima.`);

  for (const journal of journals) {
    const handover = await prisma.serahTerima.findFirst({
      where: {
        handoverNo: journal.referenceNo,
        tenantId: journal.tenantId,
      },
      select: {
        unitId: true,
      },
    });

    const unitId = journal.entries.find((entry) => entry.unitId)?.unitId ?? handover?.unitId;
    if (!unitId) {
      console.log(`Journal: ${journal.referenceNo}`);
      console.log("! Skip: unitId tidak ditemukan");
      continue;
    }

    const total = await prisma.transaction.aggregate({
      where: {
        tenantId: journal.tenantId,
        unitId,
        category: {
          in: ["BOOKING_FEE", "DOWN_PAYMENT", "PENCAIRAN_KPR", "PELUNASAN_CASH"],
        },
      },
      _sum: { amount: true },
    });

    const nilaiBenar = total._sum.amount ?? 0;
    const debitEntry = journal.entries.find((entry) => Number(entry.debit) > 0);
    const creditEntry = journal.entries.find((entry) => Number(entry.credit) > 0);

    console.log(`Journal: ${journal.referenceNo}`);
    console.log(`Nilai sekarang: ${debitEntry?.debit ?? 0}`);
    console.log(`Nilai benar: ${nilaiBenar}`);

    for (const entry of journal.entries) {
      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: {
          debit: Number(entry.debit) > 0 ? nilaiBenar : 0,
          credit: Number(entry.credit) > 0 ? nilaiBenar : 0,
        },
      });
    }

    console.log(`✓ Berhasil diupdate ke ${nilaiBenar}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
