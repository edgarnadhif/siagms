import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import UsersClient from "./UsersClient";

export default async function UsersPage(props: {
  searchParams?: Promise<{ search?: string; role?: string; status?: string; add?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN"]);
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const roleFilter = searchParams?.role || "";
  const statusFilter = searchParams?.status || "";
  const showAddModal = searchParams?.add === "true";

  const users = await prisma.user.findMany({
    where: {
      tenantId: auth.tenantId,
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(roleFilter ? { role: roleFilter as "SUPER_ADMIN" | "AKUNTAN" | "MARKETING" } : {}),
      ...(statusFilter === "active" ? { isActive: true } : {}),
      ...(statusFilter === "inactive" ? { isActive: false } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <UsersClient
      users={serializedUsers}
      currentUserId={auth.id}
      search={search}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      showAddModal={showAddModal}
    />
  );
}
