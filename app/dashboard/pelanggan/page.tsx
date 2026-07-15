import { prisma } from "@/lib/db";
import { requirePageAuth } from "@/lib/page-auth";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const auth = await requirePageAuth(["ADMIN", "AKUNTAN"]);
  const params = await searchParams;
  const projectFilter = params?.project || "";
  // Fetch all customers so the client can update the list immediately after delete.
  const customers = await prisma.customer.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(projectFilter ? { unit: { is: { projectId: projectFilter } } } : {}),
    },
    include: {
      unit: {
        include: {
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const transactions = JSON.parse(JSON.stringify(customers));

  return <PelangganClient initialData={transactions} currentRole={auth.role} />;
}
