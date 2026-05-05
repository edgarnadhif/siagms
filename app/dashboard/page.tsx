import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

const PENDAPATAN_DIAKUI_CATEGORIES = [
  "BOOKING_FEE",
  "DOWN_PAYMENT",
  "PENCAIRAN_KPR",
  "PELUNASAN_CASH",
] as const;

const LABA_RUGI_BEBAN_CATEGORIES = [
  "BIAYA_KONSTRUKSI",
  "BIAYA_MARKETING",
  "BIAYA_GAJI",
  "BIAYA_OPERASIONAL",
  "LAIN_LAIN",
] as const;

export default async function DashboardPage(props: {
  searchParams?: Promise<{ project?: string }>;
}) {
const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const projectFilter = searchParams?.project && searchParams?.project !== "all" ? searchParams.project : null;

  const journalWhere = {
    tenantId: auth.tenantId,
    ...(projectFilter
      ? {
          OR: [
            { unit: { is: { projectId: projectFilter } } },
            { transaction: { is: { unit: { projectId: projectFilter } } } },
            { transaction: { is: { projectId: projectFilter, unitId: null } } },
          ],
        }
      : {}),
  };

  const entries = await prisma.journalEntry.findMany({
    where: journalWhere,
    include: {
      account: { select: { code: true, type: true, normalBalance: true } },
    },
  });

  const totalRevenue = 0;
  let modalDisetor = 0;
  let labaDitahan = 0;

  for (const entry of entries) {
    const code = entry.account.code;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    const netCredit = credit - debit;

    if (code === "3100") modalDisetor += netCredit;
    if (code === "3200") labaDitahan += netCredit;
  }

  // 1.5 Calculate Total Budget
  let totalBudget = 0;
  if (projectFilter) {
    const proj = await prisma.project.findFirst({ where: { id: projectFilter, tenantId: auth.tenantId } });
    if (proj) totalBudget = Number(proj.budget);
  } else {
    const projs = await prisma.project.findMany({ where: { tenantId: auth.tenantId } });
    totalBudget = projs.reduce((sum, p) => sum + Number(p.budget), 0);
  }

  // 1.8 Unit Statistics & KPIs
  const unitSummary = await prisma.unit.groupBy({
    by: ['status'],
    where: {
      tenantId: auth.tenantId,
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
    _count: { id: true },
    _sum: { price: true }
  });

  const unitStats = {
    TERSEDIA: 0,
    BOOKING: 0,
    INDENT: 0,
    AKAD: 0,
    LUNAS: 0,
    SERAH_TERIMA: 0,
  };

  unitSummary.forEach(group => {
    if (group.status in unitStats) {
      (unitStats as any)[group.status] = group._count.id;
    }
  });

  const pendapatanDiakuiAgg = await prisma.transaction.aggregate({
    where: {
      tenantId: auth.tenantId,
      category: {
        in: [...PENDAPATAN_DIAKUI_CATEGORIES],
      },
      ...(projectFilter ? { projectId: projectFilter } : {}),
      unit: {
        is: {
          tenantId: auth.tenantId,
          status: { in: ["SERAH_TERIMA"] },
          ...(projectFilter ? { projectId: projectFilter } : {}),
        },
      },
    },
    _sum: { amount: true },
  });

  const pendapatanDiakui = Number(pendapatanDiakuiAgg._sum.amount || 0);

  const expenseCategoryAgg = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      tenantId: auth.tenantId,
      category: {
        in: [...LABA_RUGI_BEBAN_CATEGORIES],
      },
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
    _sum: { amount: true },
  });

  const expenseTotalsByCategory = new Map(
    expenseCategoryAgg.map((group) => [
      group.category,
      Number(group._sum.amount || 0),
    ]),
  );
  const bebanKonstruksi = expenseTotalsByCategory.get("BIAYA_KONSTRUKSI") || 0;
  const bebanMarketing = expenseTotalsByCategory.get("BIAYA_MARKETING") || 0;
  const bebanGaji = expenseTotalsByCategory.get("BIAYA_GAJI") || 0;
  const bebanOperasional = expenseTotalsByCategory.get("BIAYA_OPERASIONAL") || 0;
  const totalExpenses = expenseCategoryAgg.reduce(
    (sum, group) => sum + Number(group._sum.amount || 0),
    0,
  );
  const labaBersih = pendapatanDiakui - totalExpenses;

  // Calculate Piutang KPR (Units with status AKAD where method is KPR)
  const akadUnits = await prisma.unit.findMany({
    where: {
      tenantId: auth.tenantId,
      status: 'AKAD',
      ...(projectFilter ? { projectId: projectFilter } : {}),
      customer: { paymentMethod: 'KPR' }
    },
    include: {
      customer: true,
      transactions: {
        where: { category: "PENCAIRAN_KPR" }
      },
      akadRecords: {
        orderBy: { createdAt: "desc" },
        take: 1,
      }
    }
  });
  
  const piutangKPR = akadUnits.reduce((sum, u) => {
    const nilaiKPRDisetujui = Number(u.akadRecords[0]?.nilaiKPR || u.customer?.kprAmount || 0);
    const cair = u.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    return sum + Math.max(0, nilaiKPRDisetujui - cair);
  }, 0);

  const totalAset = entries.reduce((sum, entry) => {
    if (entry.account.type !== "ASET") return sum;
    return sum + (Number(entry.debit) - Number(entry.credit));
  }, 0);

  const totalKewajiban = entries.reduce((sum, entry) => {
    if (entry.account.type !== "KEWAJIBAN") return sum;
    return sum + (Number(entry.credit) - Number(entry.debit));
  }, 0);

  const totalEkuitas = modalDisetor + labaDitahan + labaBersih;

  // 2. Transaksi Terbaru (Limit to 50 for breakdown table processing)
  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
    orderBy: { date: "desc" },
    include: {
      project: { select: { code: true } },
      journalEntries: { select: { id: true } },
    },
    take: 50,
  });

  const totalTransaksiCount = await prisma.transaction.count({
    where: {
      tenantId: auth.tenantId,
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
  });

  // 2.5 Hitung Arus Kas (6 Bulan Terakhir)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const cxFlowTx = await prisma.transaction.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(projectFilter ? { projectId: projectFilter } : {}),
      date: { gte: sixMonthsAgo }
    },
    orderBy: { date: 'asc' }
  });

  const cashFlowMap = new Map<string, { month: string, masuk: number, keluar: number, bersih: number }>();
  const monthsIndo = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = `${monthsIndo[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    cashFlowMap.set(`${d.getFullYear()}-${d.getMonth()}`, { month: label, masuk: 0, keluar: 0, bersih: 0 });
  }

  for (const tx of cxFlowTx) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
    if (cashFlowMap.has(key)) {
      const data = cashFlowMap.get(key)!;
      const amount = Number(tx.amount);
      if (["BOOKING_FEE", "DOWN_PAYMENT", "ANGSURAN_KPR", "PELUNASAN_CASH", "PENCAIRAN_KPR"].includes(tx.category)) {
        data.masuk += amount;
      } else if (["BIAYA_KONSTRUKSI", "BIAYA_MARKETING", "BIAYA_OPERASIONAL", "BIAYA_GAJI"].includes(tx.category)) {
        data.keluar += amount;
      }
    }
  }

  let cumulativeBersih = 0;
  const cashFlowData = Array.from(cashFlowMap.values()).map(d => {
    cumulativeBersih += (d.masuk - d.keluar);
    d.bersih = cumulativeBersih;
    return d;
  });

  // 3. Breakdown Biaya / Penerimaan from Transactions
  const breakdownMap = new Map<string, number>();
  for (const trx of transactions) {
    const amount = Number(trx.amount);
    // Sum for breakdown (expense related categories)
    if (["BIAYA_KONSTRUKSI", "BIAYA_MARKETING", "BIAYA_OPERASIONAL", "BIAYA_GAJI"].includes(trx.category)) {
      const current = breakdownMap.get(trx.category) || 0;
      breakdownMap.set(trx.category, current + amount);
    }
  }

  // Calculate kas diterina & pendapatan diakui from ALL transactions accurately, not just latest 50
  const txAgg = await prisma.transaction.groupBy({
    by: ['status_pengakuan', 'category'],
    where: {
      tenantId: auth.tenantId,
      category: { in: ["BOOKING_FEE", "DOWN_PAYMENT", "ANGSURAN_KPR", "PELUNASAN_CASH", "PENCAIRAN_KPR"] },
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    _sum: { amount: true }
  });

  let kasDiterima = 0;
  let totalBookingFee = 0;
  let totalDownPayment = 0;
  let totalPelunasan = 0;

  for (const group of txAgg) {
    const sumAmt = Number(group._sum.amount || 0);
    kasDiterima += sumAmt;
    if (group.category === 'BOOKING_FEE') totalBookingFee += sumAmt;
    if (group.category === 'DOWN_PAYMENT') totalDownPayment += sumAmt;
    if (['PELUNASAN_CASH', 'PENCAIRAN_KPR', 'ANGSURAN_KPR'].includes(group.category)) totalPelunasan += sumAmt;
  }

  const breakdownData = [
    { label: "Konstruksi", value: breakdownMap.get("BIAYA_KONSTRUKSI") || 0, color: "#f97316" }, // orange-500
    { label: "Marketing", value: breakdownMap.get("BIAYA_MARKETING") || 0, color: "#0ea5e9" }, // sky-500
    { label: "Gaji", value: breakdownMap.get("BIAYA_GAJI") || 0, color: "#10b981" }, // emerald-500
    { label: "Operasional", value: breakdownMap.get("BIAYA_OPERASIONAL") || 0, color: "#f43f5e" }, // rose-500
  ].filter(d => d.value > 0);

  // If no expense breakdown found, provide an empty base for the UI so it doesn't break
  if (breakdownData.length === 0) {
    breakdownData.push({ label: "Belum Ada Pengeluaran", value: 1, color: "#FFF0E6" });
  }

  // 4. Projects List
  const projects = await prisma.project.findMany({
    where: { tenantId: auth.tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, code: true, name: true, startDate: true, status: true },
  });

  const serializedProjects = projects.map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    startDate: p.startDate ? p.startDate.toISOString() : null,
    status: p.status,
  }));

  // Map latest transactions for UI table (pass all 50 from line 57 for pagination)
  const recentTransactions = transactions.map((trx: any) => ({
    id: trx.id,
    date: trx.date.toISOString(),
    reference: trx.reference,
    description: trx.description,
    note: trx.note,
    category: trx.category,
    amount: Number(trx.amount),
    projectCode: trx.project?.code || "-",
    hasJournal: trx.journalEntries.length > 0,
  }));

  return (
    <DashboardClient
      totalRevenue={totalRevenue}
      totalExpenses={totalExpenses}
      totalBudget={totalBudget}
      labaBersih={labaBersih}
      totalTransaksi={totalTransaksiCount}
      cashFlowData={cashFlowData}
      breakdownData={breakdownData}
      projects={serializedProjects}
      recentTransactions={recentTransactions}
      totalBookingFee={totalBookingFee}
      totalDownPayment={totalDownPayment}
      totalPelunasan={totalPelunasan}
      kasDiterima={kasDiterima}
      pendapatanDiakui={pendapatanDiakui}
      bebanKonstruksi={bebanKonstruksi}
      bebanMarketing={bebanMarketing}
      bebanGaji={bebanGaji}
      bebanOperasional={bebanOperasional}
      projectFilter={projectFilter || "all"}
      unitStats={unitStats}
      piutangKPR={piutangKPR}
      totalAset={totalAset}
      totalKewajiban={totalKewajiban}
      totalEkuitas={totalEkuitas}
    />
  );
}
