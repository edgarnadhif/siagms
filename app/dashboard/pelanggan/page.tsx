import { prisma } from "@/lib/db";
import PelangganClient from "./PelangganClient";

export default async function PelangganPage() {
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    include: {
      unit: {
        include: {
          project: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return <PelangganClient initialData={customers} />;
}
