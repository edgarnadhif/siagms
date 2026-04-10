// @ts-nocheck
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const { prisma } = await import("../lib/db.ts");

const PROJECT_CODE_CANDIDATES = ["testing", "trx-001", "TRX-001"];
const PROJECT_NAME_PATTERNS = ["test", "TEST", "testtt"];
const CUSTOMER_PATTERNS = ["test", "asd", "xxx", "123456"];
const PROTECTED_PROJECT_CODE = "PRJ-001";

function containsAny(value: string | null | undefined, patterns: string[]) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function uniq<T>(values: T[]) {
  return Array.from(new Set(values));
}

async function main() {
  const candidateProjects = await prisma.project.findMany({
    where: {
      NOT: { code: PROTECTED_PROJECT_CODE },
    },
    select: {
      id: true,
      tenantId: true,
      code: true,
      name: true,
      status: true,
    },
    orderBy: [{ code: "asc" }, { name: "asc" }],
  });

  const projectsToDelete = candidateProjects.filter(
    (project) =>
      PROJECT_CODE_CANDIDATES.includes(project.code) ||
      containsAny(project.name, PROJECT_NAME_PATTERNS)
  );

  const projectIds = projectsToDelete.map((project) => project.id);

  const unitsToDelete = projectIds.length
    ? await prisma.unit.findMany({
        where: { projectId: { in: projectIds } },
        select: {
          id: true,
          tenantId: true,
          unitCode: true,
          projectId: true,
          customerId: true,
        },
        orderBy: { unitCode: "asc" },
      })
    : [];

  const unitIds = unitsToDelete.map((unit) => unit.id);
  const customerIdsFromUnits = unitsToDelete.map((unit) => unit.customerId).filter(Boolean);

  const projectTransactions = projectIds.length
    ? await prisma.transaction.findMany({
        where: {
          OR: [
            { unitId: { in: unitIds } },
            { projectId: { in: projectIds }, unitId: null },
          ],
        },
        select: {
          id: true,
          tenantId: true,
          reference: true,
          unitId: true,
          projectId: true,
          customerId: true,
          category: true,
          amount: true,
        },
        orderBy: [{ date: "asc" }, { reference: "asc" }],
      })
    : [];

  const orphanTransactions = await prisma.transaction.findMany({
    where: {
      unitId: null,
      projectId: null,
    },
    select: {
      id: true,
      tenantId: true,
      reference: true,
      category: true,
      amount: true,
    },
    orderBy: [{ date: "asc" }, { reference: "asc" }],
  });

  const allTransactionsToDelete = [...projectTransactions, ...orphanTransactions];
  const transactionIdsToDelete = allTransactionsToDelete.map((tx) => tx.id);
  const transactionRefsToDelete = allTransactionsToDelete.map((tx) => tx.reference);

  const unitAkadsToDelete = unitIds.length
    ? await prisma.unitAkad.findMany({
        where: { unitId: { in: unitIds } },
        select: { id: true, nomorAkad: true, unitId: true },
      })
    : [];

  const serahTerimasToDelete = unitIds.length
    ? await prisma.serahTerima.findMany({
        where: { unitId: { in: unitIds } },
        select: { id: true, handoverNo: true, unitId: true, tenantId: true },
      })
    : [];

  const cancellationsToDelete = unitIds.length
    ? await prisma.cancellation.findMany({
        where: { unitId: { in: unitIds } },
        select: { id: true, unitId: true },
      })
    : [];

  const extraRefsToDelete = [
    ...serahTerimasToDelete.map((item) => item.handoverNo),
  ];

  const allRefsToDelete = uniq([
    ...transactionRefsToDelete,
    ...extraRefsToDelete,
  ]);

  const journalEntriesToDelete = allRefsToDelete.length
    ? await prisma.journalEntry.findMany({
        where: {
          OR: [
            { transactionId: { in: transactionIdsToDelete } },
            { reference: { in: allRefsToDelete } },
            ...(unitIds.length ? [{ unitId: { in: unitIds } }] : []),
          ],
        },
        select: {
          id: true,
          journalId: true,
          reference: true,
          transactionId: true,
          unitId: true,
        },
      })
    : [];

  const journalIdsFromEntries = journalEntriesToDelete
    .map((entry) => entry.journalId)
    .filter(Boolean);

  const journalsByReference = allRefsToDelete.length
    ? await prisma.journal.findMany({
        where: { referenceNo: { in: allRefsToDelete } },
        select: { id: true, referenceNo: true },
      })
    : [];

  const journalIdsToDelete = uniq([
    ...journalIdsFromEntries,
    ...journalsByReference.map((journal) => journal.id),
  ]);

  const journalsToDelete = journalIdsToDelete.length
    ? await prisma.journal.findMany({
        where: { id: { in: journalIdsToDelete } },
        select: { id: true, referenceNo: true, tenantId: true },
      })
    : [];

  const orphanCustomers = await prisma.customer.findMany({
    where: {
      unit: null,
      OR: [
        ...CUSTOMER_PATTERNS.map((pattern) => ({ name: { contains: pattern, mode: "insensitive" } })),
        ...CUSTOMER_PATTERNS.map((pattern) => ({ nik: { contains: pattern, mode: "insensitive" } })),
      ],
    },
    select: {
      id: true,
      tenantId: true,
      customerCode: true,
      name: true,
      nik: true,
    },
    orderBy: [{ name: "asc" }, { customerCode: "asc" }],
  });

  const customerIdsToDelete = uniq([
    ...orphanCustomers.map((customer) => customer.id),
    ...customerIdsFromUnits,
  ]);

  console.log("Preview proyek yang akan dihapus:");
  if (projectsToDelete.length === 0) {
    console.log("- Tidak ada proyek test yang terdeteksi.");
  } else {
    projectsToDelete.forEach((project) => {
      console.log(`- [${project.code}] ${project.name} (tenant: ${project.tenantId})`);
    });
  }

  console.log("\nPreview unit yang akan dihapus:");
  if (unitsToDelete.length === 0) {
    console.log("- Tidak ada unit terkait.");
  } else {
    unitsToDelete.forEach((unit) => {
      console.log(`- ${unit.unitCode} (projectId: ${unit.projectId})`);
    });
  }

  console.log("\nPreview transaksi yang akan dihapus:");
  if (allTransactionsToDelete.length === 0) {
    console.log("- Tidak ada transaksi terkait/orphan.");
  } else {
    allTransactionsToDelete.forEach((tx) => {
      console.log(`- ${tx.reference} | ${tx.category} | ${Number(tx.amount)}`);
    });
  }

  console.log("\nPreview customer orphan yang akan dihapus:");
  if (orphanCustomers.length === 0) {
    console.log("- Tidak ada customer orphan test.");
  } else {
    orphanCustomers.forEach((customer) => {
      console.log(`- [${customer.customerCode}] ${customer.name} | NIK: ${customer.nik}`);
    });
  }

  console.log(`\nPRJ-001 tidak tersentuh ✓`);

  const rl = createInterface({ input, output });
  const answer = await rl.question(
    `Apakah yakin menghapus ${projectsToDelete.length} proyek, ${unitsToDelete.length} unit, ${allTransactionsToDelete.length} transaksi? (yes/no) `
  );
  rl.close();

  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Dibatalkan. Tidak ada data yang dihapus.");
    await prisma.$disconnect();
    return;
  }

  const summary = await prisma.$transaction(async (tx) => {
    if (projectsToDelete.some((project) => project.code === PROTECTED_PROJECT_CODE)) {
      throw new Error("Guard gagal: PRJ-001 ikut terdeteksi untuk dihapus.");
    }

    let deletedJournalEntries = 0;
    let deletedJournals = 0;
    let deletedTransactions = 0;
    let deletedUnitAkads = 0;
    let deletedSerahTerimas = 0;
    let deletedCancellations = 0;
    let deletedUnits = 0;
    let deletedProjects = 0;
    let deletedCustomers = 0;

    if (journalEntriesToDelete.length > 0) {
      const result = await tx.journalEntry.deleteMany({
        where: { id: { in: journalEntriesToDelete.map((entry) => entry.id) } },
      });
      deletedJournalEntries = result.count;
    }

    if (journalsToDelete.length > 0) {
      const result = await tx.journal.deleteMany({
        where: { id: { in: journalsToDelete.map((journal) => journal.id) } },
      });
      deletedJournals = result.count;
    }

    if (transactionIdsToDelete.length > 0) {
      const result = await tx.transaction.deleteMany({
        where: { id: { in: transactionIdsToDelete } },
      });
      deletedTransactions = result.count;
    }

    if (unitAkadsToDelete.length > 0) {
      const result = await tx.unitAkad.deleteMany({
        where: { id: { in: unitAkadsToDelete.map((item) => item.id) } },
      });
      deletedUnitAkads = result.count;
    }

    if (serahTerimasToDelete.length > 0) {
      const result = await tx.serahTerima.deleteMany({
        where: { id: { in: serahTerimasToDelete.map((item) => item.id) } },
      });
      deletedSerahTerimas = result.count;
    }

    if (cancellationsToDelete.length > 0) {
      const result = await tx.cancellation.deleteMany({
        where: { id: { in: cancellationsToDelete.map((item) => item.id) } },
      });
      deletedCancellations = result.count;
    }

    if (unitIds.length > 0) {
      const result = await tx.unit.deleteMany({
        where: { id: { in: unitIds } },
      });
      deletedUnits = result.count;
    }

    if (projectIds.length > 0) {
      const result = await tx.project.deleteMany({
        where: { id: { in: projectIds }, code: { not: PROTECTED_PROJECT_CODE } },
      });
      deletedProjects = result.count;
    }

    if (orphanCustomers.length > 0) {
      const result = await tx.customer.deleteMany({
        where: { id: { in: orphanCustomers.map((customer) => customer.id) } },
      });
      deletedCustomers = result.count;
    }

    return {
      deletedProjects,
      deletedUnits,
      deletedTransactions,
      deletedJournals,
      deletedJournalEntries,
      deletedUnitAkads,
      deletedSerahTerimas,
      deletedCancellations,
      deletedCustomers,
    };
  });

  console.log(`Proyek dihapus: ${summary.deletedProjects}`);
  console.log(`Unit dihapus: ${summary.deletedUnits}`);
  console.log(`Transaksi dihapus: ${summary.deletedTransactions}`);
  console.log(`Jurnal dihapus: ${summary.deletedJournals}`);
  console.log(`JournalEntry dihapus: ${summary.deletedJournalEntries}`);
  console.log(`UnitAkad dihapus: ${summary.deletedUnitAkads}`);
  console.log(`SerahTerima dihapus: ${summary.deletedSerahTerimas}`);
  console.log(`Cancellation dihapus: ${summary.deletedCancellations}`);
  console.log(`Customer dihapus: ${summary.deletedCustomers}`);
  console.log("PRJ-001 tidak tersentuh ✓");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
