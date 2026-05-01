import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { ProjectStatus } from "@prisma/client";
import AddProjectModal from "./AddProjectModal";
import ProjectFilters from "./ProjectFilters";
import ProjectGrid from "./ProjectGrid";
import ProjectToaster from "./ProjectToaster";

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
const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
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
      <ProjectToaster />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Daftar Proyek</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola daftar proyek dan tracking keuangan per proyek
          </p>
        </div>
        <Link
          href="?add=true"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200 w-full md:w-auto md:ml-auto"
        >
          <img
            src="/add.svg"
            alt="Add"
            className="w-4 h-4 invert dark:invert-0"
          />
          Tambah Proyek
        </Link>
      </div>

      {/* Action Bar (Search) */}
      <div className="sticky -top-6 z-30 pt-2 pb-3 bg-white dark:bg-[#111827] -mx-6 px-6">
        <div className="w-full">
          <ProjectFilters initialSearch={search} initialStatus={status} />
        </div>
      </div>

      {/* Project Grid (Drag & Drop) */}
      <div className="px-4 md:px-0 pb-6">
        {projects.length > 0 ? (
          <ProjectGrid initialProjects={projects} />
        ) : (
          <div className="bg-white dark:bg-slate-800 border-[0.5px] border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="py-55 px-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <img
                  src="/folder.svg"
                  alt="Proyek"
                  className="w-10 h-10 opacity-20 grayscale dark:invert"
                />
              </div>
              <p className="font-bold text-gray-900 dark:text-white">
                Belum ada proyek yang ditemukan
              </p>
              <p className="text-sm text-gray-400 mt-1 italic">
                Cobalah ubah filter pencarian Anda atau tambahkan proyek baru.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Proyek */}
      {showAddModal && <AddProjectModal />}
    </div>
  );
}
