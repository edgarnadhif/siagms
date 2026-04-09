import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import KuitansiClient from "./KuitansiClient";

const RECEIPT_CATEGORIES = [
  "BOOKING_FEE",
  "DOWN_PAYMENT",
  "ANGSURAN_KPR",
  "PELUNASAN_CASH",
  "PENCAIRAN_KPR",
] as const;

export default async function KuitansiPage() {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);

  const rawTransactions = await prisma.transaction.findMany({
    where: {
      tenantId: auth.tenantId,
      category: { in: [...RECEIPT_CATEGORIES] },
    },
    include: {
      customer: { select: { name: true, customerCode: true } },
      unit: { select: { unitCode: true, blockName: true, unitNumber: true } },
      project: { select: { name: true, code: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  const companyProfile = await prisma.companyProfile.findFirst({
    where: { tenantId: auth.tenantId }
  });

  // Serialize Decimal and Date
  const transactions = rawTransactions.map(tx => ({
    ...tx,
    amount: Number(tx.amount),
    date: tx.date.toISOString(),
    kwitansiDate: tx.kwitansiDate?.toISOString() || null,
  }));

  return (
    <KuitansiClient 
      transactions={transactions} 
      companyProfile={companyProfile}
    />
  );
}
