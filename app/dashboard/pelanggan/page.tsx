import { prisma } from "@/lib/db";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage() {
  // Fetch all customers (active & inactive) so client-side toggle works without refetch
  const customers = await prisma.customer.findMany({
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
