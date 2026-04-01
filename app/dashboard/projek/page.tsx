import { prisma } from "@/lib/db";
import ProjectCard from "./ProjectCard";
import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import AddProjectModal from "./AddProjectModal";

export default async function ProjectPage(props: {
  searchParams?: Promise<{ search?: string; status?: string; add?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const status = searchParams?.status || "";
  const showAddModal = searchParams?.add === "true";

  const rawProjects = await prisma.project.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status ? { status: status as ProjectStatus } : {}),
    },
    include: {
      _count: {
        select: { transactions: true },
      },
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
  }));

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen">
      {/* Header Container */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Daftar Proyek
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kelola daftar proyek dan tracking keuangan per proyek
            </p>
          </div>
          <Link
            href="?add=true"
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-red-500/20"
          >
            Tambah
            <span className="text-lg leading-none">+</span>
          </Link>
        </div>

        {/* Filters */}
        <form className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 dark:text-gray-500">
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
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Cari nama atau kode proyek"
              className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="w-full md:w-48 relative">
            <select
              name="status"
              defaultValue={status}
              className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-900 dark:text-gray-100"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="SELESAI">Selesai</option>
              <option value="BATAL">Batal</option>
            </select>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {projects.length}
          </span>{" "}
          proyek ditemukan
          {search && (
            <span>
              {" "}
              untuk &quot;<span className="font-medium">{search}</span>&quot;
            </span>
          )}
          {status && (
            <span>
              {" "}
              · Status:{" "}
              <span className="font-medium">
                {status === "AKTIF"
                  ? "Aktif"
                  : status === "SELESAI"
                    ? "Selesai"
                    : "Batal"}
              </span>
            </span>
          )}
        </p>
        {(search || status) && (
          <Link
            href="/dashboard/projek"
            className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
          >
            Reset filter
          </Link>
        )}
      </div>

      {/* Grid Projects */}
      {projects.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Belum ada proyek ditambahkan.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Klik tombol &quot;Tambah&quot; untuk menambahkan proyek baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project as any}
              transactionCount={project._count.transactions}
              totalIncome={0}
              totalExpense={0}
            />
          ))}
        </div>
      )}

      {/* Modal Tambah Proyek */}
      {showAddModal && <AddProjectModal />}
    </div>
  );
}
