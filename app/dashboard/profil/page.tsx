import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ProfilForm from "./ProfilForm";

export default async function ProfilPage() {
  const auth = await requireAuth(["SUPER_ADMIN"]);
  const profile = await prisma.companyProfile.findUnique({
    where: { tenantId: auth.tenantId },
  });

  const initialData = profile || {
    name: "SIAGMS",
    address: null,
    phone: null,
    email: null,
    logoUrl: null,
  };

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Profil Perusahaan</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Pengaturan informasi perusahaan untuk kop laporan & identitas sistem
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[14px] border-[0.5px] border-[#E5E7EB] dark:border-slate-700 shadow-sm overflow-hidden w-full mx-4 md:mx-0">
        <div className="p-6">
          <ProfilForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
