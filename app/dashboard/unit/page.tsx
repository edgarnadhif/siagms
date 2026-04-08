import { prisma } from "@/lib/db";
import UnitClient from "./UnitClient";

export default async function UnitPage() {
  // Fetch all units (active & inactive) so client-side toggle works without refetch
  const units = await prisma.unit.findMany({
    include: {
      project: { select: { id: true, name: true, code: true } },
      customer: true,
    },
    orderBy: [{ blockName: "asc" }, { unitNumber: "asc" }],
  });

  const projects = await prisma.project.findMany({
    where: { status: { not: "BATAL" } },
    select: { id: true, name: true, code: true },
  });

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, customerCode: true, paymentMethod: true },
  });

  return <UnitClient initialData={units} projects={projects} customers={customers} />;
}
