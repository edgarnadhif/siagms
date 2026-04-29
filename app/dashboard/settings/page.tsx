import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import { prisma } from "@/lib/db";
import CompanySettingsForm from "./CompanySettingsForm";
import SettingsClient from "./SettingsClient";
import JournalMappingConfig from "./JournalMappingConfig";

export default async function SettingsPage() {
  const auth = await requireAuth(["SUPER_ADMIN"]);
  const companySettings = await getCompanySettingsByTenantId(auth.tenantId);

  // Fetch active accounts for journal mapping dropdown
  const accounts = await prisma.account.findMany({
    where: {
      tenantId: auth.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
    },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      <div className="mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Pengaturan
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
          Kelola identitas perusahaan, konfigurasi jurnal, dan pembersihan data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-[#EA6C00] rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 21h16.5M4.5 3.75h15A1.5 1.5 0 0 1 21 5.25v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 15.75V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
                />
              </svg>
            </span>
            Pengaturan Perusahaan
          </h2>

          <CompanySettingsForm
            initialData={{
              companyName: companySettings.companyName,
              companyAddress: companySettings.companyAddress ?? "",
              companyPhone: companySettings.companyPhone ?? "",
              companyEmail: companySettings.companyEmail ?? "",
            }}
          />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-[#EA6C00] rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </span>
            Pembersihan Data (Cleanup)
          </h2>

          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Fungsi ini akan mencari jurnal serah terima BA-ST yang dobel atau nominalnya masih salah akibat bug sebelumnya.
              Sistem akan menyisakan satu pasang entry Debit 2100 dan Kredit 4100 per nomor berita acara, lalu menghitung ulang nilainya dari total Booking Fee, Down Payment, Pencairan KPR, dan Pelunasan Cash.
            </p>

            <SettingsClient actionType="cleanupST" />
          </div>
        </div>
      </div>

      {/* Journal Mapping Configuration - Full Width */}
      <div className="mt-8 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-3">
            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-[#EA6C00] rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </span>
            Konfigurasi Jurnal Otomatis
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 ml-14">
            Atur akun debit dan kredit untuk setiap kategori transaksi. Perubahan akan mempengaruhi jurnal otomatis yang dibuat saat input transaksi baru.
          </p>

          <JournalMappingConfig accounts={accounts} />
        </div>
      </div>
    </div>
  );
}
