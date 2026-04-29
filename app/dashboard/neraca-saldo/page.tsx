import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import { prisma } from "@/lib/db";

import NeracaSaldoClient from "./NeracaSaldoClient";

type SearchParams = {
  from?: string;
  to?: string;
  project?: string;
};

function buildProjectEntryWhere(projectId: string): Prisma.JournalEntryWhereInput {
  if (!projectId) {
    return {};
  }

  return {
    OR: [
      { unit: { is: { projectId } } },
      { transaction: { is: { unit: { projectId } } } },
      { transaction: { is: { projectId, unitId: null } } },
    ],
  };
}

export default async function NeracaSaldoPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";

  const dateFilter: Prisma.DateTimeFilter = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate) dateFilter.lte = new Date(`${toDate}T23:59:59`);

  const [entries, projects, companySettings] = await Promise.all([
    prisma.journalEntry.findMany({
      where: {
        tenantId: auth.tenantId,
        ...(fromDate || toDate ? { date: dateFilter } : {}),
        ...buildProjectEntryWhere(projectFilter),
      },
      include: {
        account: {
          select: { code: true, name: true, type: true, normalBalance: true },
        },
      },
    }),
    prisma.project.findMany({
      where: { tenantId: auth.tenantId },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    getCompanySettingsByTenantId(auth.tenantId),
  ]);

  const accountBalances = new Map<
    string,
    {
      code: string;
      name: string;
      type: string;
      normalBalance: string;
      totalDebitIdx: number;
      totalCreditIdx: number;
      finalDebit: number;
      finalCredit: number;
    }
  >();

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

  const balances = Array.from(accountBalances.values())
    .map((item) => {
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
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  return (
    <NeracaSaldoClient
      balances={balances}
      projects={projects}
      companyName={companySettings.companyName}
      fromDate={fromDate}
      toDate={toDate}
      projectFilter={projectFilter}
    />
  );
}
