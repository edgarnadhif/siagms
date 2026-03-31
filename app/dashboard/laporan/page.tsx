import { prisma } from "@/lib/db";
import LaporanClient from "./LaporanClient";

export default async function LaporanKeuanganPage(props: {
  searchParams?: Promise<{ from?: string; to?: string; project?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";
  const activeTab = searchParams?.tab || "laba_rugi";

  // Build date filter for journal entries
  const dateFilter: any = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate) dateFilter.lte = new Date(toDate + "T23:59:59");

  // Get all journal entries with account info
  const entries = await prisma.journalEntry.findMany({
    where: {
      ...(fromDate || toDate ? { date: dateFilter } : {}),
      ...(projectFilter
        ? { transaction: { projectId: projectFilter } }
        : {}),
    },
    include: {
      account: {
        select: { code: true, name: true, type: true, normalBalance: true },
      },
    },
  });

  // Aggregate by account for Laba Rugi (PENDAPATAN vs BEBAN)
  const accountBalances = new Map<string, {
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    balance: number;
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
        balance: 0,
      });
    }
    const item = accountBalances.get(key)!;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    // Compute balance based on normal balance
    if (acc.normalBalance === "DEBIT") {
      item.balance += debit - credit;
    } else {
      item.balance += credit - debit;
    }
  }

  const allBalances = Array.from(accountBalances.values()).sort((a, b) => a.code.localeCompare(b.code));

  // Laba Rugi
  const pendapatan = allBalances.filter((a) => a.type === "PENDAPATAN");
  const beban = allBalances.filter((a) => a.type === "BEBAN");
  const totalPendapatan = pendapatan.reduce((s, a) => s + a.balance, 0);
  const totalBeban = beban.reduce((s, a) => s + a.balance, 0);
  const labaBersih = totalPendapatan - totalBeban;

  // Neraca
  const aset = allBalances.filter((a) => a.type === "ASET");
  const kewajiban = allBalances.filter((a) => a.type === "KEWAJIBAN");
  const ekuitas = allBalances.filter((a) => a.type === "EKUITAS");
  const totalAset = aset.reduce((s, a) => s + a.balance, 0);
  const totalKewajiban = kewajiban.reduce((s, a) => s + a.balance, 0);
  const totalEkuitas = ekuitas.reduce((s, a) => s + a.balance, 0);

  // Get projects for filter
  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  // Get company profile
  const company = await prisma.companyProfile.findFirst();

  return (
    <LaporanClient
      activeTab={activeTab}
      fromDate={fromDate}
      toDate={toDate}
      projectFilter={projectFilter}
      projects={projects}
      companyName={company?.name || "SIAGMS"}
      pendapatan={pendapatan}
      beban={beban}
      totalPendapatan={totalPendapatan}
      totalBeban={totalBeban}
      labaBersih={labaBersih}
      aset={aset}
      kewajiban={kewajiban}
      ekuitas={ekuitas}
      totalAset={totalAset}
      totalKewajiban={totalKewajiban}
      totalEkuitas={totalEkuitas}
    />
  );
}
