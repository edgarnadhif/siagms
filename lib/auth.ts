import "server-only";

import { prisma } from "@/lib/db";
import { type AppRole, verifySession } from "@/lib/session";

export class AuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.status = status;
  }
}

export async function requireAuth(allowedRoles?: AppRole[]) {
  const session = await verifySession();

  if (!session) {
    throw new AuthorizationError("Unauthenticated", 401);
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      tenantId: session.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      tenantId: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AuthorizationError("User tidak ditemukan atau nonaktif", 401);
  }

  if (allowedRoles && !allowedRoles.includes(user.role as AppRole)) {
    throw new AuthorizationError("Akses ditolak", 403);
  }

  return user;
}

export function getTenantWhere<T extends object>(
  tenantId: string,
  where?: T,
): T & { tenantId: string } {
  return {
    tenantId,
    ...(where ?? {}),
  } as T & { tenantId: string };
}
