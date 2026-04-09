import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import NeracaSaldoClient from "./NeracaSaldoClient";

export default async function NeracaSaldoPage(props: {
  searchParams?: Promise<{ from?: string; to?: string; project?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";

  // Build date filter for journal entries
  const dateFilter: any = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate) dateFilter.lte = new Date(toDate + "T23:59:59");

  // Get all journal entries with account info
  const entries = await prisma.journalEntry.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(fromDate || toDate ? { date: dateFilter } : {}),
      ...(projectFilter
        ? { transaction: { is: { projectId: projectFilter } } }
        : {}),
    },
    include: {
      account: {
        select: { code: true, name: true, type: true, normalBalance: true },
      },
    },
  });

  // Aggregate by account for Trial Balance
  const accountBalances = new Map<string, {
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    totalDebitIdx: number;
    totalCreditIdx: number;
    finalDebit: number;
    finalCredit: number;
  }>();

  for (const entry of entries) {
    const acc = entry.account;
    const key = acc.code;
    if (!accountBalances.has(key)) {
      accountBalances.set(key, {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        totalDebitIdx: 0,
        totalCreditIdx: 0,
        finalDebit: 0,
        finalCredit: 0,
      });
    }
    const item = accountBalances.get(key)!;
    item.totalDebitIdx += Number(entry.debit);
    item.totalCreditIdx += Number(entry.credit);
  }

  // Calculate final balances based on normal balance
  const balances = Array.from(accountBalances.values()).map(item => {
    if (item.normalBalance === "DEBIT") {
      const saldo = item.totalDebitIdx - item.totalCreditIdx;
      if (saldo >= 0) {
        item.finalDebit = saldo;
      } else {
        item.finalCredit = Math.abs(saldo);
      }
    } else {
      const saldo = item.totalCreditIdx - item.totalDebitIdx;
      if (saldo >= 0) {
        item.finalCredit = saldo;
      } else {
        item.finalDebit = Math.abs(saldo);
      }
    }
    return item;
  }).sort((a, b) => a.code.localeCompare(b.code));

  // Get projects for filter
  const projects = await prisma.project.findMany({
    where: { tenantId: auth.tenantId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <NeracaSaldoClient 
      balances={balances} 
      projects={projects}
      fromDate={fromDate}
      toDate={toDate}
      projectFilter={projectFilter}
    />
  );
}
