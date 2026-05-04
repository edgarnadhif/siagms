import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";

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
      <Sidebar role={auth.role} user={{ email: auth.email, role: auth.role, fullName: auth.fullName }} />
      <main className="flex-1 overflow-y-auto relative h-[calc(100vh-24px)] my-3 mr-3 ml-0 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        {children}
      </main>
    </div>
  );
}
