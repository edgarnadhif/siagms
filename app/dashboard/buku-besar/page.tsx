import { prisma } from "@/lib/db";
import BukuBesarClient from "./BukuBesarClient";

export default async function BukuBesarPage(props: {
  searchParams?: Promise<{ account?: string; from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;
  const accountFilter = searchParams?.account || "";
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";

  // Fetch all active accounts for the filter dropdown
  const allAccounts = await prisma.account.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, type: true, normalBalance: true },
    orderBy: { code: "asc" },
  });

  // Build journal entry filter
  const journalWhere: any = {};
  if (accountFilter) {
    journalWhere.accountId = accountFilter;
  }
  if (fromDate || toDate) {
    journalWhere.date = {};
    if (fromDate) journalWhere.date.gte = new Date(fromDate);
    if (toDate) journalWhere.date.lte = new Date(toDate + "T23:59:59");
  }

  const entries = await prisma.journalEntry.findMany({
    where: journalWhere,
    include: {
      account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
    },
    orderBy: [{ date: "asc" }],
  });

  // Group by account
  const accountMap = new Map<string, {
    id: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    transactions: { id: string; date: string; reference: string; description: string | null; debit: number; credit: number; balance: number }[];
    endingBalance: number;
  }>();

  let globalTotalDebit = 0;
  let globalTotalCredit = 0;

  for (const entry of entries) {
    const acc = entry.account;
    if (!accountMap.has(acc.id)) {
      accountMap.set(acc.id, {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        transactions: [],
        endingBalance: 0,
      });
    }

    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    globalTotalDebit += debit;
    globalTotalCredit += credit;

    const group = accountMap.get(acc.id)!;
    // Running balance: for DEBIT normal, balance = sum(debit) - sum(credit); for KREDIT, reverse
    const prevBalance = group.endingBalance;
    const newBalance =
      acc.normalBalance === "DEBIT"
        ? prevBalance + debit - credit
        : prevBalance + credit - debit;
    group.endingBalance = newBalance;

    group.transactions.push({
      id: entry.id,
      date: entry.date.toISOString(),
      reference: entry.reference,
      description: entry.description,
      debit,
      credit,
      balance: newBalance,
    });
  }

  const ledgerAccounts = Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <BukuBesarClient
      allAccounts={allAccounts}
      ledgerAccounts={ledgerAccounts}
      totalDebit={globalTotalDebit}
      totalCredit={globalTotalCredit}
      accountFilter={accountFilter}
      fromDate={fromDate}
      toDate={toDate}
    />
  );
}
