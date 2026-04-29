import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import BukuBesarClient from "./BukuBesarClient";

type SearchParams = {
  account?: string;
  project?: string;
  from?: string;
  to?: string;
};

function getProjectInfo(entry: {
  project: { id: string; code: string; name: string } | null;
  transaction: {
    project: { id: string; code: string; name: string } | null;
    unit: { project: { id: string; code: string; name: string } | null } | null;
  } | null;
}) {
  const project =
    entry.project ||
    entry.transaction?.unit?.project ||
    entry.transaction?.project ||
    null;
  return project
    ? {
        id: project.id,
        code: project.code,
        name: project.name,
        label: `${project.code} - ${project.name}`,
      }
    : {
        id: "no-project",
        code: "-",
        name: "Tidak ada proyek",
        label: "Tidak ada proyek",
      };
}

export default async function BukuBesarPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const accountFilter = searchParams?.account || "";
  const projectFilter = searchParams?.project || "";
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";

  const selectedProjectId = projectFilter || "";
  const fromDateObj = fromDate ? new Date(fromDate) : null;
  const toDateObj = toDate ? new Date(`${toDate}T23:59:59`) : null;

  const [allAccounts, projects, companySettings] = await Promise.all([
    prisma.account.findMany({
      where: { tenantId: auth.tenantId, isActive: true },
      select: { id: true, code: true, name: true, type: true, normalBalance: true },
      orderBy: { code: "asc" },
    }),
    prisma.project.findMany({
      where: { tenantId: auth.tenantId, status: "AKTIF" },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    getCompanySettingsByTenantId(auth.tenantId),
  ]);

  const currentPeriodWhere = {
    tenantId: auth.tenantId,
    ...(accountFilter ? { accountId: accountFilter } : {}),
    ...(fromDateObj || toDateObj
      ? {
          date: {
            ...(fromDateObj ? { gte: fromDateObj } : {}),
            ...(toDateObj ? { lte: toDateObj } : {}),
          },
        }
      : {}),
    ...(selectedProjectId
      ? {
          OR: [
            {
              projectId: selectedProjectId,
            },
            {
              unit: {
                is: {
                  projectId: selectedProjectId,
                },
              },
            },
            {
              transaction: {
                is: {
                  unit: { projectId: selectedProjectId },
                },
              },
            },
            {
              transaction: {
                is: {
                  projectId: selectedProjectId,
                  unitId: null,
                },
              },
            },
          ],
        }
      : {}),
  };

  const includeConfig = {
    account: { select: { id: true, code: true, name: true, type: true, normalBalance: true } },
    project: { select: { id: true, code: true, name: true } },
    transaction: {
      include: {
        project: { select: { id: true, code: true, name: true } },
        unit: {
          include: {
            project: { select: { id: true, code: true, name: true } },
          },
        },
      },
    },
  } as const;

  const [entries, openingEntries] = await Promise.all([
    prisma.journalEntry.findMany({
      where: currentPeriodWhere,
      include: includeConfig,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    selectedProjectId || !fromDateObj
      ? Promise.resolve([])
      : prisma.journalEntry.findMany({
          where: {
            tenantId: auth.tenantId,
            ...(accountFilter ? { accountId: accountFilter } : {}),
            date: { lt: fromDateObj },
          },
          include: {
            account: { select: { id: true, normalBalance: true } },
          },
          orderBy: [{ date: "asc" }, { createdAt: "asc" }],
        }),
  ]);

  const openingBalanceMap = new Map<string, number>();
  for (const entry of openingEntries) {
    const current = openingBalanceMap.get(entry.account.id) || 0;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    const next =
      entry.account.normalBalance === "DEBIT"
        ? current + debit - credit
        : current + credit - debit;
    openingBalanceMap.set(entry.account.id, next);
  }

  const accountMap = new Map<
    string,
    {
      id: string;
      code: string;
      name: string;
      type: string;
      normalBalance: string;
      openingBalance: number;
      totalDebit: number;
      totalCredit: number;
      endingBalance: number;
      transactionCount: number;
      transactions: Array<{
        id: string;
        date: string;
        reference: string;
        description: string | null;
        projectId: string;
        projectCode: string;
        projectName: string;
        projectLabel: string;
        debit: number;
        credit: number;
        balance: number;
      }>;
    }
  >();

  const projectSummaryMap = new Map<
    string,
    { projectId: string; projectCode: string; projectName: string; totalDebit: number; totalCredit: number }
  >();

  let globalTotalDebit = 0;
  let globalTotalCredit = 0;

  for (const entry of entries) {
    const acc = entry.account;
    const projectInfo = getProjectInfo(entry);
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);

    if (!accountMap.has(acc.id)) {
      const openingBalance = selectedProjectId ? 0 : openingBalanceMap.get(acc.id) || 0;
      accountMap.set(acc.id, {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        openingBalance,
        totalDebit: 0,
        totalCredit: 0,
        endingBalance: openingBalance,
        transactionCount: 0,
        transactions: [],
      });
    }

    if (!projectSummaryMap.has(projectInfo.id)) {
      projectSummaryMap.set(projectInfo.id, {
        projectId: projectInfo.id,
        projectCode: projectInfo.code,
        projectName: projectInfo.name,
        totalDebit: 0,
        totalCredit: 0,
      });
    }

    globalTotalDebit += debit;
    globalTotalCredit += credit;

    const projectSummary = projectSummaryMap.get(projectInfo.id)!;
    projectSummary.totalDebit += debit;
    projectSummary.totalCredit += credit;

    const group = accountMap.get(acc.id)!;
    const newBalance =
      acc.normalBalance === "DEBIT"
        ? group.endingBalance + debit - credit
        : group.endingBalance + credit - debit;

    group.totalDebit += debit;
    group.totalCredit += credit;
    group.endingBalance = newBalance;
    group.transactionCount += 1;
    group.transactions.push({
      id: entry.id,
      date: entry.date.toISOString(),
      reference: entry.reference,
      description: entry.description,
      projectId: projectInfo.id,
      projectCode: projectInfo.code,
      projectName: projectInfo.name,
      projectLabel: projectInfo.label,
      debit,
      credit,
      balance: newBalance,
    });
  }

  const ledgerAccounts = Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  const projectSummary = Array.from(projectSummaryMap.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;
  const periodLabel =
    fromDate && toDate
      ? `${new Date(fromDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} - ${new Date(toDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`
      : "Semua periode";

  return (
    <BukuBesarClient
      key={`${accountFilter}|${projectFilter}|${fromDate}|${toDate}`}
      companyName={companySettings.companyName}
      allAccounts={allAccounts}
      projects={projects}
      ledgerAccounts={ledgerAccounts}
      projectSummary={projectSummary}
      totalDebit={globalTotalDebit}
      totalCredit={globalTotalCredit}
      accountFilter={accountFilter}
      projectFilter={projectFilter}
      fromDate={fromDate}
      toDate={toDate}
      selectedProjectName={selectedProject ? selectedProject.name : ""}
      periodLabel={periodLabel}
    />
  );
}
