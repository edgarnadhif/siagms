import { requireAuth } from "@/lib/auth";
import { getCompanySettingsByTenantId } from "@/lib/company-settings";
import CompanySettingsForm from "./CompanySettingsForm";

export default async function SettingsPage() {
  const auth = await requireAuth(["ADMIN"]);
  const companySettings = await getCompanySettingsByTenantId(auth.tenantId);

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      <div className="mb-8 px-4 md:px-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Pengaturan
        </h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">
          Kelola identitas perusahaan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 px-4 md:px-0">
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
      </div>
    </div>
  );
}
