import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage() {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
  // Fetch all customers (active & inactive) so client-side toggle works without refetch
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

  return <PelangganClient initialData={customers} />;
}
