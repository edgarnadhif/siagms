import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import UnitClient from "./UnitClient";

export default async function UnitPage() {
  const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  // Fetch all units (active & inactive) so client-side toggle works without refetch
  const units = await prisma.unit.findMany({
    where: { tenantId: auth.tenantId },
    include: {
      project: { select: { id: true, name: true, code: true } },
      customer: true,
    },
    orderBy: [{ blockName: "asc" }, { unitNumber: "asc" }],
  });

  const projects = await prisma.project.findMany({
    where: { tenantId: auth.tenantId, status: { not: "BATAL" } },
    select: { id: true, name: true, code: true },
  });

  const customers = await prisma.customer.findMany({
    where: { tenantId: auth.tenantId, isActive: true },
    select: { id: true, name: true, customerCode: true, paymentMethod: true },
  });

  const serializedUnits = JSON.parse(JSON.stringify(units));

  return <UnitClient initialData={serializedUnits} projects={projects} customers={customers} />;
}
