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
      account: { select: { type: true, normalBalance: true } },
    },
  });

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const entry of entries) {
    const type = entry.account.type;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    
    // Revenue is CREDIT normal
    if (type === "PENDAPATAN") {
      totalRevenue += (credit - debit);
    }
    // Expense is DEBIT normal
    if (type === "BEBAN") {
      totalExpenses += (debit - credit);
    }
  }

  const labaBersih = totalRevenue - totalExpenses;

  // 2. Transaksi Terbaru
  const transactions = await prisma.transaction.findMany({
    where: projectFilter ? { projectId: projectFilter } : {},
    orderBy: { date: "desc" },
    include: { project: { select: { code: true } } },
    take: 50, // Get enough to calculate breakdown and sparklines
  });

  const totalTransaksiCount = await prisma.transaction.count({
    where: projectFilter ? { projectId: projectFilter } : {},
  });

  // 3. Breakdown Biaya / Penerimaan from Transactions
  const breakdownMap = new Map<string, number>();
  let totalBookingFee = 0;
  let totalDownPayment = 0;
  
  for (const trx of transactions) {
    const amount = Number(trx.amount);
    
    // Sum for breakdown (expense related categories)
    if (["BIAYA_PROYEK", "BIAYA_OPERASIONAL"].includes(trx.category)) {
      const current = breakdownMap.get(trx.category) || 0;
      breakdownMap.set(trx.category, current + amount);
    }

    // Revenue specifics
    if (trx.category === "BOOKING_FEE") totalBookingFee += amount;
    if (trx.category === "DOWN_PAYMENT") totalDownPayment += amount;
  }

  const breakdownData = [
    { label: "Biaya Proyek", value: breakdownMap.get("BIAYA_PROYEK") || 0, color: "#f97316" },
    { label: "Biaya Operasional", value: breakdownMap.get("BIAYA_OPERASIONAL") || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // If no expense breakdown found, provide an empty base for the UI so it doesn't break
  if (breakdownData.length === 0) {
    breakdownData.push({ label: "Belum Ada Pengeluaran", value: 1, color: "#e5e7eb" });
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

  // Map latest 5 transactions for UI table
  const recentTransactions = transactions.slice(0, 5).map((trx: any) => ({
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
      labaBersih={labaBersih}
      totalTransaksi={totalTransaksiCount}
      breakdownData={breakdownData}
      projects={serializedProjects}
      recentTransactions={recentTransactions}
      totalBookingFee={totalBookingFee}
      totalDownPayment={totalDownPayment}
      projectFilter={projectFilter || "all"}
    />
  );
}
