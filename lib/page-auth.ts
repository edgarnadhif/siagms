import "server-only";

import { redirect } from "next/navigation";
import {
  AuthorizationError,
  requireAuth,
} from "@/lib/auth";
import type { AppRole } from "@/lib/session";

export async function requirePageAuth(allowedRoles?: AppRole[]) {
  try {
    return await requireAuth(allowedRoles);
  } catch (error) {
    if (error instanceof AuthorizationError && error.status === 401) {
      redirect("/login");
    }

    throw error;
  }
}
