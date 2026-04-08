import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const RECEIPT_CATEGORIES = [
  "BOOKING_FEE",
  "DOWN_PAYMENT",
  "ANGSURAN_KPR",
  "PELUNASAN_CASH",
  "PENCAIRAN_KPR",
] as const;

export default async function KuitansiPage() {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);

  const transactions = await prisma.transaction.findMany({
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

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Kuitansi
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
            Ringkasan transaksi penerimaan yang paling relevan untuk penerbitan kuitansi tenant ini.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm overflow-hidden mx-4 md:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-[#F9FAFB] dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Tanggal</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Referensi</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Pelanggan</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Unit</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Proyek</th>
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Kategori</th>
                <th className="px-6 py-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-[#FFF0E6]/30 dark:hover:bg-slate-700/40 transition-all duration-150">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-100">
                    {new Date(transaction.date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
                    {transaction.reference}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.customer?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.unit ? `${transaction.unit.unitCode} / Blok ${transaction.unit.blockName}${transaction.unit.unitNumber}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.project?.name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-bold text-[#EA6C00]">
                    Rp {Number(transaction.amount).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada transaksi yang siap dijadikan kuitansi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
