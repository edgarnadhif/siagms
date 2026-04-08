import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let auth;

  try {
    auth = await requireAuth();
  } catch {
    redirect("/login");
  }

  return (
    <div suppressHydrationWarning className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar role={auth.role} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar user={{ email: auth.email, role: auth.role }} />
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>
    </div>
  );
}
