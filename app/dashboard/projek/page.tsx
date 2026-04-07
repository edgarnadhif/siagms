import { prisma } from "@/lib/db";
import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import AddProjectModal from "./AddProjectModal";
import ProjectFilters from "./ProjectFilters";
import ProjectGrid from "./ProjectGrid";

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; add?: string }>;
}) {
  const { search = "", status = "", add } = await searchParams;
  const showAddModal = add === "true";

  const rawProjects = await prisma.project.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status: status as ProjectStatus } : {},
      ],
    },
    include: {
      transactions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal and Date for Client Component
  const projects = rawProjects.map((p) => ({
    ...p,
    budget: Number(p.budget),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    startDate: p.startDate?.toISOString() || null,
    endDate: p.endDate?.toISOString() || null,
    transactions: p.transactions.map(t => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }))
  }));

  return (
    <div className="bg-gray-100 dark:bg-[#0f172a] border-2 border-gray-200 dark:border-gray-800 rounded-2xl pt-4 md:p-5 md:pt-5 min-h-[calc(100vh-80px)] shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Daftar Proyek
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Kelola daftar proyek dan tracking keuangan per proyek
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-10 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Proyek
        </Link>
      </div>

      {/* Action Bar (Search) */}
      <div className="sticky top-0 z-30 pt-2 pb-4 bg-gray-100 dark:bg-[#0f172a] -mx-4 md:-mx-0 px-4 md:px-0">
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="flex-1 w-full">
            <ProjectFilters initialSearch={search} initialStatus={status} />
          </div>
        </div>
      </div>

      {/* Project Grid (Drag & Drop) */}
      <div className="px-4 md:px-0 pb-6">
        {projects.length > 0 ? (
          <ProjectGrid initialProjects={projects} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4 opacity-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">Belum ada proyek yang ditemukan</p>
            <p className="text-sm">Cobalah ubah filter pencarian Anda atau tambahkan proyek baru.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah Proyek */}
      {showAddModal && <AddProjectModal />}
    </div>
  );
}
