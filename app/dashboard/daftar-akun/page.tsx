import { prisma } from "@/lib/db";
import DaftarAkunClient from "./DaftarAkunClient";

export default async function DaftarAkunPage(props: {
  searchParams?: Promise<{ search?: string; type?: string; add?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const type = searchParams?.type || "";
  const showAddModal = searchParams?.add === "true";

  const accounts = await prisma.account.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(type ? { type: type as any } : {}),
      isActive: true, // HANYA TAMPILKAN YANG AKTIF
    },
    orderBy: [{ type: "asc" }, { code: "asc" }],
  });

  // Group accounts by type
  const grouped: Record<string, typeof accounts> = {};
  for (const acc of accounts) {
    if (!grouped[acc.type]) grouped[acc.type] = [];
    grouped[acc.type].push(acc);
  }

  const totalCount = accounts.length;

  return (
    <DaftarAkunClient
      grouped={grouped}
      totalCount={totalCount}
      search={search}
      type={type}
      showAddModal={showAddModal}
    />
  );
}
