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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Profil Perusahaan
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Pengaturan informasi perusahaan untuk kop laporan & identitas sistem
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50/80 dark:bg-slate-900/40 rounded-[24px] p-6 shadow-sm border border-gray-100/50 dark:border-slate-800/50 max-w-4xl">
        <ProfilForm initialData={initialData} />
      </div>
    </div>
  );
}
