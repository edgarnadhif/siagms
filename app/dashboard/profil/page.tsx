import { prisma } from "@/lib/db";
import ProfilForm from "./ProfilForm";

export default async function ProfilPage() {
  const profile = await prisma.companyProfile.findFirst();

  const initialData = profile || {
    name: "SIAGMS",
    address: null,
    phone: null,
    email: null,
    logoUrl: null,
  };

  return (
    <div className="bg-gray-50">
      <div className="bg-gray-100 rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Profil Perusahaan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pengaturan informasi perusahaan untuk laporan & kuitansi
          </p>
        </div>
        <ProfilForm initialData={initialData} />
      </div>
    </div>
  );
}
