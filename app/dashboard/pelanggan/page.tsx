import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage() {
  const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
  // Fetch all customers so the client can update the list immediately after delete.
  const customers = await prisma.customer.findMany({
    where: { tenantId: auth.tenantId },
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
