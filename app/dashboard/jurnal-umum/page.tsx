import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import JurnalUmumClient from "./JurnalUmumClient";

export default async function JurnalUmumPage(props: {
  searchParams?: Promise<{ search?: string; add?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const showAddModal = searchParams?.add === "true";

  // Fetch all journal entries and group by reference
  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(search
      ? {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    },
    include: {
      account: { select: { code: true, name: true } },
    },
    orderBy: [{ date: "desc" }, { reference: "asc" }],
  });

  // Group by reference
  const groupedMap = new Map<string, {
    reference: string;
    date: string;
    description: string | null;
    entries: { id: string; accountCode: string; accountName: string; debit: number; credit: number }[];
    totalDebit: number;
    totalCredit: number;
    isAuto: boolean;
  }>();

  for (const entry of entries) {
    if (!groupedMap.has(entry.reference)) {
      groupedMap.set(entry.reference, {
        reference: entry.reference,
        date: entry.date.toISOString(),
        description: entry.description,
        entries: [],
        totalDebit: 0,
        totalCredit: 0,
        isAuto: (entry as any).isAuto || false,
      });
    }
    const group = groupedMap.get(entry.reference)!;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    group.entries.push({
      id: entry.id,
      accountCode: entry.account.code,
      accountName: entry.account.name,
      debit,
      credit,
    });
    group.totalDebit += debit;
    group.totalCredit += credit;
  }

  const journals = Array.from(groupedMap.values());

  // Fetch accounts for the modal
  const accounts = await prisma.account.findMany({
    where: { tenantId: auth.tenantId, isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });

  return (
    <JurnalUmumClient
      journals={journals}
      accounts={accounts}
      search={search}
      showAddModal={showAddModal}
    />
  );
}
