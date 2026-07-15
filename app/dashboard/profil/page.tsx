import { requirePageAuth } from "@/lib/page-auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import CompanySettingsForm from "./CompanySettingsForm";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const auth = await requirePageAuth(["ADMIN", "AKUNTAN"]);
  const companySettings = await getCompanySettingsByTenantId(auth.tenantId);

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full flex flex-col pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Profil Perusahaan</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-500 mt-2">
            Kelola identitas dan informasi perusahaan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-8 flex items-center gap-3">
            <span className="p-2.5 bg-orange-50 dark:bg-orange-500/10 text-[#EA6C00] rounded-xl border border-orange-100 dark:border-orange-500/20">
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
            Informasi Dasar
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
{/* 
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-3">
            <span className="p-2.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-500/20">
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
                  d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
                />
              </svg>
            </span>
            Perbaikan Data Jurnal
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Jalankan perbaikan otomatis untuk memperbaiki jurnal Serah Terima yang duplikat, nominal salah, atau HPP (COGS) yang belum tercatat.
          </p>
          <SettingsClient actionType="cleanupST" />
        </div> */}
      </div>
    </div>
  );
}
