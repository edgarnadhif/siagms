import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import CompanySettingsForm from "./CompanySettingsForm";

export default async function SettingsPage() {
  const auth = await requireAuth(["ADMIN"]);
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
      </div>
    </div>
  );
}
