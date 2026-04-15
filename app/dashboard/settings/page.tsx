import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import CompanySettingsForm from "./CompanySettingsForm";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const auth = await requireAuth(["SUPER_ADMIN"]);
  const companySettings = await getCompanySettingsByTenantId(auth.tenantId);

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      <div className="mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Pengaturan
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
          Kelola identitas perusahaan, pembersihan data, dan konfigurasi admin.
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
    </div>
  );
}
