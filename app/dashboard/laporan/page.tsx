import { Prisma } from "@prisma/client";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";

import LaporanClient from "./LaporanClient";

type SearchParams = {
  from?: string;
  to?: string;
  project?: string;
  tab?: string;
};

function buildDateFilter(fromDate: string, toDate: string) {
  const filter: Prisma.DateTimeFilter = {};

  if (fromDate) {
    filter.gte = new Date(fromDate);
  }

  if (toDate) {
    filter.lte = new Date(`${toDate}T23:59:59`);
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

function buildProjectEntryWhere(projectId: string): Prisma.JournalEntryWhereInput {
  if (!projectId) {
    return {};
  }

  return {
    OR: [
      { projectId },
      { unit: { is: { projectId } } },
      { transaction: { is: { unit: { projectId } } } },
      { transaction: { is: { projectId, unitId: null } } },
    ],
  };
}

function buildJournalEntryWhere(
  tenantId: string,
  fromDate: string,
  toDate: string,
  projectId: string,
): Prisma.JournalEntryWhereInput {
  const dateFilter = buildDateFilter(fromDate, toDate);

  return {
    tenantId,
    ...(dateFilter ? { date: dateFilter } : {}),
    ...buildProjectEntryWhere(projectId),
  };
}

function getExpenseLabel(accountCode: string) {
  switch (accountCode) {
    case "5300":
      return "bebanMarketing";
    case "5400":
      return "bebanGaji";
    case "5500":
      return "bebanOperasional";
    case "5600":
      return "bebanLainLain";
    default:
      return null;
  }
}

export default async function LaporanKeuanganPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";
  const activeTab = searchParams?.tab || "laba_rugi";

  const periodEntryWhere = buildJournalEntryWhere(
    auth.tenantId,
    fromDate,
    toDate,
    projectFilter,
  );
  const neracaEntryWhere = buildJournalEntryWhere(
    auth.tenantId,
    "",
    toDate,
    projectFilter,
  );

  const openingDate = fromDate ? new Date(fromDate) : null;
  const projectEntryWhere = buildProjectEntryWhere(projectFilter);
  const endingDateFilter = toDate
    ? ({ lte: new Date(`${toDate}T23:59:59`) } satisfies Prisma.DateTimeFilter)
    : undefined;

  const [
    entries,
    neracaEntries,
    expenseAccounts,
    openingCashEntries,
    cashLedgerBalance,
    projects,
    companySettings,
  ] = await Promise.all([
    prisma.journalEntry.findMany({
      where: periodEntryWhere,
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true,
            normalBalance: true,
          },
        },
        transaction: {
          select: {
            category: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.journalEntry.findMany({
      where: neracaEntryWhere,
      include: {
        account: {
          select: {
            code: true,
            name: true,
            type: true,
            normalBalance: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.account.findMany({
      where: {
        tenantId: auth.tenantId,
        type: "BEBAN",
        isActive: true,
      },
      select: {
        code: true,
        name: true,
      },
      orderBy: { code: "asc" },
    }),
    openingDate
      ? prisma.journalEntry.findMany({
          where: {
            tenantId: auth.tenantId,
            account: {
              code: { in: ["1100", "1200"] },
            },
            date: { lt: openingDate },
            ...projectEntryWhere,
          },
          select: {
            debit: true,
            credit: true,
          },
        })
      : Promise.resolve([]),
    prisma.journalEntry.aggregate({
      where: {
        tenantId: auth.tenantId,
        account: {
          code: { in: ["1100", "1200"] },
        },
        ...(endingDateFilter ? { date: endingDateFilter } : {}),
        ...projectEntryWhere,
      },
      _sum: {
        debit: true,
        credit: true,
      },
    }),
    prisma.project.findMany({
      where: { tenantId: auth.tenantId },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
    }),
    getCompanySettingsByTenantId(auth.tenantId),
  ]);

  const balances = new Map<string, number>();
  const revenueBalances = new Map<string, number>();
  const expenseBalances = new Map<string, number>();
  let neracaLabaBerjalan = 0;

  const cashFlowData = {
    bookingFee: 0,
    downPayment: 0,
    pencairanKPR: 0,
    pelunasanCash: 0,
    penerimaanLainnya: 0,
    konstruksi: 0,
    marketing: 0,
    gaji: 0,
    operasional: 0,
    lain: 0,
  };

  let kasMutasiPeriode = 0;

  for (const entry of entries) {
    const accountCode = entry.account.code;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);

    if (entry.account.type === "PENDAPATAN") {
      revenueBalances.set(
        accountCode,
        (revenueBalances.get(accountCode) || 0) + (credit - debit),
      );
    }

    if (entry.account.type === "BEBAN") {
      expenseBalances.set(
        accountCode,
        (expenseBalances.get(accountCode) || 0) + (debit - credit),
      );
    }

    if (accountCode === "1100" || accountCode === "1200") {
      const cashMutation = debit - credit;
      kasMutasiPeriode += cashMutation;

      if (cashMutation >= 0) {
        switch (entry.transaction?.category) {
          case "BOOKING_FEE":
            cashFlowData.bookingFee += cashMutation;
            break;
          case "DOWN_PAYMENT":
            cashFlowData.downPayment += cashMutation;
            break;
          case "PENCAIRAN_KPR":
            cashFlowData.pencairanKPR += cashMutation;
            break;
          case "PELUNASAN_CASH":
            cashFlowData.pelunasanCash += cashMutation;
            break;
          default:
            cashFlowData.penerimaanLainnya += cashMutation;
            break;
        }
      } else {
        const cashOutflow = Math.abs(cashMutation);

        switch (entry.transaction?.category) {
          case "BIAYA_KONSTRUKSI":
            cashFlowData.konstruksi += cashOutflow;
            break;
          case "BIAYA_MARKETING":
            cashFlowData.marketing += cashOutflow;
            break;
          case "BIAYA_GAJI":
            cashFlowData.gaji += cashOutflow;
            break;
          case "BIAYA_OPERASIONAL":
            cashFlowData.operasional += cashOutflow;
            break;
          default:
            cashFlowData.lain += cashOutflow;
            break;
        }
      }
    }
  }

  for (const entry of neracaEntries) {
    const accountCode = entry.account.code;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    const signedBalance =
      entry.account.normalBalance === "DEBIT"
        ? debit - credit
        : credit - debit;

    balances.set(accountCode, (balances.get(accountCode) || 0) + signedBalance);

    if (entry.account.type === "PENDAPATAN" || entry.account.type === "BEBAN") {
      neracaLabaBerjalan += credit - debit;
    }
  }

  const sumByPrefix = (prefix: string) =>
    Array.from(balances.entries())
      .filter(([code]) => code.startsWith(prefix))
      .reduce((sum, [, amount]) => sum + amount, 0);

  const pendapatanPenjualan = revenueBalances.get("4100") || 0;
  const pendapatanLainLain = Array.from(revenueBalances.entries())
    .filter(([code]) => code !== "4100")
    .reduce((sum, [, amount]) => sum + amount, 0);
  const totalPendapatanLR = Array.from(revenueBalances.values()).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  const hppUmum = expenseBalances.get("5100") || 0;
  const bebanKonstruksi = expenseBalances.get("5200") || 0;
  const hpp = hppUmum + bebanKonstruksi;
  const labaKotor = totalPendapatanLR - hpp;

  const expenseBreakdown = {
    bebanMarketing: 0,
    bebanGaji: 0,
    bebanOperasional: 0,
    bebanLainLain: 0,
  };

  for (const account of expenseAccounts) {
    const amount = expenseBalances.get(account.code) || 0;
    const key = getExpenseLabel(account.code);

    if (key) {
      expenseBreakdown[key] += amount;
      continue;
    }

    if (account.code !== "5100" && account.code !== "5200") {
      expenseBreakdown.bebanLainLain += amount;
    }
  }

  const totalBebanOperasional = Object.values(expenseBreakdown).reduce(
    (sum, value) => sum + value,
    0,
  );
  const labaBersih = totalPendapatanLR - hpp - totalBebanOperasional;

  const labaRugiData = {
    pendapatanPenjualan,
    pendapatanLainLain,
    totalPendapatanLR,
    hppUmum,
    bebanKonstruksi,
    hpp,
    labaKotor,
    ...expenseBreakdown,
    totalBebanOperasional,
    labaBersih,
  };

  const neracaData = {
    kas: balances.get("1100") || 0,
    bank: balances.get("1200") || 0,
    piutangPembeli: balances.get("1300") || 0,
    piutangKPR: balances.get("1400") || 0,
    persediaanUnit: balances.get("1500") || 0,
    bdk: balances.get("1600") || 0,
    tanah: balances.get("1700") || 0,
    totalAset: sumByPrefix("1"),
    pendDiterimaDiMuka: balances.get("2100") || 0,
    hutangKontraktor: balances.get("2200") || 0,
    hutangUsaha: balances.get("2300") || 0,
    hutangBank: balances.get("2400") || 0,
    totalKewajiban: sumByPrefix("2"),
    modalDisetor: balances.get("3100") || 0,
    labaDitahan: balances.get("3200") || 0,
    labaBersih: neracaLabaBerjalan,
    totalEkuitas:
      (balances.get("3100") || 0) +
      (balances.get("3200") || 0) +
      neracaLabaBerjalan,
  };

  const saldoAwal = openingCashEntries.reduce((sum, entry) => {
    return sum + Number(entry.debit) - Number(entry.credit);
  }, 0);

  const saldoAkhir = saldoAwal + kasMutasiPeriode;
  const saldoBukuBesar =
    Number(cashLedgerBalance._sum.debit || 0) -
    Number(cashLedgerBalance._sum.credit || 0);

  const arusKasData = {
    operasiMasuk: {
      bookingFee: cashFlowData.bookingFee,
      downPayment: cashFlowData.downPayment,
      pencairanKPR: cashFlowData.pencairanKPR,
      pelunasanCash: cashFlowData.pelunasanCash,
      penerimaanLainnya: cashFlowData.penerimaanLainnya,
    },
    operasiKeluar: {
      konstruksi: cashFlowData.konstruksi,
      marketing: cashFlowData.marketing,
      gaji: cashFlowData.gaji,
      operasional: cashFlowData.operasional,
      lain: cashFlowData.lain,
    },
    kasBersihOperasi: kasMutasiPeriode,
    kasBersihInvestasi: 0,
    kasBersihPendanaan: 0,
    saldoAwal,
    saldoAkhir,
    saldoBukuBesar,
  };

  return (
    <LaporanClient
      key={`${activeTab}|${fromDate}|${toDate}|${projectFilter}|${companySettings.companyName}`}
      activeTab={activeTab}
      fromDate={fromDate}
      toDate={toDate}
      projectFilter={projectFilter}
      projects={projects}
      companyName={companySettings.companyName}
      labaRugiData={labaRugiData}
      neracaData={neracaData}
      arusKasData={arusKasData}
    />
  );
}
