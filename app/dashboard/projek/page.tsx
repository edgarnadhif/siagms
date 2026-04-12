import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import AddProjectModal from "./AddProjectModal";
import ProjectFilters from "./ProjectFilters";
import ProjectGrid from "./ProjectGrid";

const REVENUE_CATEGORIES = [
  "BOOKING_FEE",
  "DOWN_PAYMENT",
  "PENCAIRAN_KPR",
  "PELUNASAN_CASH",
] as const;
const EXPENSE_CATEGORIES = [
  "BIAYA_KONSTRUKSI",
  "BIAYA_MARKETING",
  "BIAYA_OPERASIONAL",
  "BIAYA_GAJI",
  "LAIN_LAIN",
] as const;

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; add?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN", "MARKETING", "AKUNTAN"]);
  const { search = "", status = "", add } = await searchParams;
  const showAddModal = add === "true";

  const rawProjects = await prisma.project.findMany({
    where: {
      AND: [
        { tenantId: auth.tenantId },
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
      units: { select: { id: true, unitCode: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const projects = await Promise.all(
    rawProjects.map(async (project) => {
      const [incomeByUnit, incomeDirect, expenses, transactionCount] =
        await Promise.all([
          prisma.transaction.aggregate({
            where: {
              tenantId: auth.tenantId,
              unit: { projectId: project.id },
              category: { in: [...REVENUE_CATEGORIES] },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              tenantId: auth.tenantId,
              projectId: project.id,
              unitId: null,
              category: { in: [...REVENUE_CATEGORIES] },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              tenantId: auth.tenantId,
              projectId: project.id,
              category: { in: [...EXPENSE_CATEGORIES] },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.count({
            where: {
              tenantId: auth.tenantId,
              OR: [
                { projectId: project.id },
                { unit: { projectId: project.id } },
              ],
            },
          }),
        ]);

      const totalIncome =
        Number(incomeByUnit._sum.amount || 0) +
        Number(incomeDirect._sum.amount || 0);
      const totalExpense = Number(expenses._sum.amount || 0);

      return {
        ...project,
        budget: Number(project.budget),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        totalIncome,
        totalExpense,
        transactionCount,
      };
    }),
  );

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 lg:mb-3 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Daftar Proyek</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Kelola daftar proyek dan tracking keuangan per proyek
          </p>
        </div>
        <Link
          href="?add=true"
          className="flex items-center gap-2 px-5 h-10 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          <img
            src="/add.svg"
            alt="Add"
            className="w-5 h-5 invert dark:invert-0"
          />
          Tambah Proyek
        </Link>
      </div>

      {/* Action Bar (Search) */}
      <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6">
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
            <p className="text-lg font-medium">
              Belum ada proyek yang ditemukan
            </p>
            <p className="text-sm">
              Cobalah ubah filter pencarian Anda atau tambahkan proyek baru.
            </p>
          </div>
        )}
      </div>

      {/* Modal Tambah Proyek */}
      {showAddModal && <AddProjectModal />}
    </div>
  );
}
