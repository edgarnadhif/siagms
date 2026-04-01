import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session.userId) },
    select: { email: true, role: true }
  });

  return (
    <div suppressHydrationWarning className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>
    </div>
  );
}
