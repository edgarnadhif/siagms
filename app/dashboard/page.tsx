import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage(props: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const searchParams = await props.searchParams;
  const projectFilter = searchParams?.project && searchParams?.project !== "all" ? searchParams.project : null;

  // 1. Get total revenue & expenses from Journal Entries
  // PENDAPATAN -> Revenue
  // BEBAN -> Expenses
  const journalWhere = projectFilter ? { transaction: { projectId: projectFilter } } : {};

  const entries = await prisma.journalEntry.findMany({
    where: journalWhere,
    include: {
      account: { select: { code: true, type: true, normalBalance: true } },
    },
  });

  let totalRevenue = 0;
  let totalExpenses = 0;
  // Variables for Neraca Singkat
  let kas = 0, bank = 0, piutangPembeli = 0, bdk = 0, tanah = 0;
  let pendDiterimaDiMuka = 0, hutangKontraktor = 0, hutangUsaha = 0, hutangBank = 0;
  let modalDisetor = 0, labaDitahan = 0;
  let fallbackPendapatan4100 = 0;

  for (const entry of entries) {
    const type = entry.account.type;
    const code = entry.account.code;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    const netDebit = debit - credit;
    const netCredit = credit - debit;

    if (code === "4100") fallbackPendapatan4100 += netCredit;

    // Expense is DEBIT normal
    if (code >= "5100" && code <= "5600") {
      totalExpenses += netDebit;
    }

    if (code === "1100") kas += netDebit;
    if (code === "1200") bank += netDebit;
    if (code === "1300") piutangPembeli += netDebit;
    if (code === "1600") bdk += netDebit;
    if (code === "1700") tanah += netDebit;

    if (code === "2100") pendDiterimaDiMuka += netCredit;
    if (code === "2200") hutangKontraktor += netCredit;
    if (code === "2300") hutangUsaha += netCredit;
    if (code === "2400") hutangBank += netCredit;

    if (code === "3100") modalDisetor += netCredit;
    if (code === "3200") labaDitahan += netCredit;
  }

  // 1.5 Calculate Total Budget
  let totalBudget = 0;
  if (projectFilter) {
    const proj = await prisma.project.findUnique({ where: { id: projectFilter } });
    if (proj) totalBudget = Number(proj.budget);
  } else {
    const projs = await prisma.project.findMany();
    totalBudget = projs.reduce((sum, p) => sum + Number(p.budget), 0);
  }

  // 1.8 Unit Statistics & KPIs
  const unitSummary = await prisma.unit.groupBy({
    by: ['status'],
    where: projectFilter ? { projectId: projectFilter } : {},
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

  let pendapatanDiakui = 0;
  unitSummary.forEach(group => {
    if (group.status in unitStats) {
      (unitStats as any)[group.status] = group._count.id;
    }
  });

  // Calculate Pendapatan Diakui based on Serah Terima Units
  const stUnits = await prisma.unit.findMany({
    where: {
      status: "SERAH_TERIMA",
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    include: {
      transactions: {
        where: {
          category: { in: ["PENCAIRAN_KPR", "PELUNASAN_CASH"] }
        }
      }
    }
  });

  for (const unit of stUnits) {
    const totalTx = unit.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (totalTx > 0) {
      pendapatanDiakui += totalTx;
    } else {
      // fallback to 4100 if no transactions are found but it's ST
      pendapatanDiakui += Number(unit.price); 
    }
  }
  if (pendapatanDiakui === 0) pendapatanDiakui = fallbackPendapatan4100;
  
  const labaBersih = pendapatanDiakui - totalExpenses;

  // Calculate Piutang KPR (Units with status AKAD where method is KPR)
  const akadUnits = await prisma.unit.findMany({
    where: {
      status: 'AKAD',
      ...(projectFilter ? { projectId: projectFilter } : {}),
      customer: { paymentMethod: 'KPR' }
    },
    include: { transactions: true }
  });
  
  const piutangKPR = akadUnits.reduce((sum, u) => {
    const paid = u.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    return sum + (Number(u.price) - paid);
  }, 0);

  const tersediaUnits = await prisma.unit.aggregate({
    where: {
      status: "TERSEDIA",
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    _sum: { price: true }
  });
  const persediaanUnit = Number(tersediaUnits._sum.price || 0);

  const totalAset = kas + bank + piutangPembeli + piutangKPR + persediaanUnit + bdk + tanah;
  const totalKewajiban = pendDiterimaDiMuka + hutangKontraktor + hutangUsaha + hutangBank;
  const totalEkuitas = modalDisetor + labaDitahan + labaBersih;

  // 2. Transaksi Terbaru (Limit to 50 for breakdown table processing)
  const transactions = await prisma.transaction.findMany({
    where: projectFilter ? { projectId: projectFilter } : {},
    orderBy: { date: "desc" },
    include: { project: { select: { code: true } } },
    take: 50,
  });

  const totalTransaksiCount = await prisma.transaction.count({
    where: projectFilter ? { projectId: projectFilter } : {},
  });

  // 2.5 Hitung Arus Kas (6 Bulan Terakhir)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const cxFlowTx = await prisma.transaction.findMany({
    where: {
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
      category: { in: ["BOOKING_FEE", "DOWN_PAYMENT", "ANGSURAN_KPR", "PELUNASAN_CASH", "PENCAIRAN_KPR"] },
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    _sum: { amount: true }
  });

  let kasDiterima = 0;
  let pendapatanDiakuiTx = 0;
  let totalBookingFee = 0;
  let totalDownPayment = 0;
  let totalPelunasan = 0;

  for (const group of txAgg) {
    const sumAmt = Number(group._sum.amount || 0);
    kasDiterima += sumAmt;
    if (group.status_pengakuan === 'diakui') {
      pendapatanDiakuiTx += sumAmt;
    }
    if (group.category === 'BOOKING_FEE') totalBookingFee += sumAmt;
    if (group.category === 'DOWN_PAYMENT') totalDownPayment += sumAmt;
    if (['PELUNASAN_CASH', 'PENCAIRAN_KPR', 'ANGSURAN_KPR'].includes(group.category)) totalPelunasan += sumAmt;
  }

  const breakdownData = [
    { label: "Konstruksi", value: breakdownMap.get("BIAYA_KONSTRUKSI") || 0, color: "#EA6C00" },
    { label: "Marketing", value: breakdownMap.get("BIAYA_MARKETING") || 0, color: "#f97316" },
    { label: "Gaji", value: breakdownMap.get("BIAYA_GAJI") || 0, color: "#fb923c" },
    { label: "Operasional", value: breakdownMap.get("BIAYA_OPERASIONAL") || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // If no expense breakdown found, provide an empty base for the UI so it doesn't break
  if (breakdownData.length === 0) {
    breakdownData.push({ label: "Belum Ada Pengeluaran", value: 1, color: "#FFF0E6" });
  }

  // 4. Projects List
  const projects = await prisma.project.findMany({
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
    category: trx.category,
    amount: Number(trx.amount),
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
      projectFilter={projectFilter || "all"}
      unitStats={unitStats}
      piutangKPR={piutangKPR}
      totalAset={totalAset}
      totalKewajiban={totalKewajiban}
      totalEkuitas={totalEkuitas}
    />
  );
}
