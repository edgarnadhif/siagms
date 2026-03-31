import { prisma } from "@/lib/db";
import TransaksiClient from "./TransaksiClient";

export default async function TransaksiPage(props: {
  searchParams?: Promise<{ search?: string; category?: string; project?: string; add?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const category = searchParams?.category || "";
  const projectFilter = searchParams?.project || "";
  const showAddModal = searchParams?.add === "true";

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: "insensitive" } },
              { reference: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(category ? { category: category as any } : {}),
      ...(projectFilter ? { projectId: projectFilter } : {}),
    },
    include: {
      project: { select: { code: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  const projects = await prisma.project.findMany({
    where: { status: "AKTIF" },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  // Serialize Decimal to number for client
  const serialized = transactions.map((t) => ({
    id: t.id,
    reference: t.reference,
    date: t.date.toISOString(),
    description: t.description,
    note: t.note,
    category: t.category,
    amount: Number(t.amount),
    projectCode: t.project?.code || "-",
    projectName: t.project?.name || null,
  }));

  return (
    <TransaksiClient
      transactions={serialized}
      projects={projects}
      search={search}
      category={category}
      projectFilter={projectFilter}
      showAddModal={showAddModal}
    />
  );
}
