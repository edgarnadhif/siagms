import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import TransaksiClient from "./TransaksiClient";

export default async function TransaksiPage(props: {
  searchParams?: Promise<{ search?: string; category?: string; project?: string; add?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN"]);
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const category = searchParams?.category || "";
  const projectFilter = searchParams?.project || "";
  const showAddModal = searchParams?.add === "true";

  const transactions = await prisma.transaction.findMany({
    where: {
      tenantId: auth.tenantId,
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
      unit: { select: { id: true, unitCode: true, blockName: true, unitNumber: true } },
      customer: { select: { id: true, name: true, paymentMethod: true } },
      journalEntries: { select: { id: true } },
    },
    orderBy: { date: "desc" },
  });

  const projects = await prisma.project.findMany({
    where: { tenantId: auth.tenantId, status: "AKTIF" },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  const units = await prisma.unit.findMany({
    where: { tenantId: auth.tenantId, status: { not: "TERSEDIA" } },
    include: { customer: true },
    orderBy: { blockName: "asc" },
  });

  const customers = await prisma.customer.findMany({
    where: { tenantId: auth.tenantId },
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
    projectId: t.projectId,
    unitId: t.unitId,
    unitCode: t.unit?.unitCode || null,
    customerId: t.customerId,
    customerName: t.customer?.name || null,
    paymentMethod: t.customer?.paymentMethod || null,
    hasJournal: (t as any).journalEntries?.length > 0,
  }));

  return (
    <TransaksiClient
      transactions={serialized}
      projects={projects}
      units={JSON.parse(JSON.stringify(units))}
      customers={JSON.parse(JSON.stringify(customers))}
      search={search}
      category={category}
      projectFilter={projectFilter}
      showAddModal={showAddModal}
    />
  );
}
