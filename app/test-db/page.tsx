import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TestDbPage() {
  let auth;

  try {
    auth = await requireAuth(["ADMIN"]);
  } catch {
    redirect("/login");
  }

  const userCount = await prisma.user.count({
    where: { tenantId: auth.tenantId },
  });

  return (
    <div className="p-8 font-sans">
      <h1 className="mb-4 text-2xl font-bold">Database Connection Test</h1>
      <div className="rounded border border-green-400 bg-green-100 p-4 text-green-700">
        <h2 className="font-bold">Success!</h2>
        <p>Connected to PostgreSQL database successfully</p>
        <p className="mt-2 text-sm">User tenant ini: {userCount}</p>
      </div>
    </div>
  );
}
