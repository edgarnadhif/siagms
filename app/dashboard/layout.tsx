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
    <div suppressHydrationWarning className="flex h-dvh overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar role={auth.role} user={{ email: auth.email, role: auth.role, fullName: auth.fullName }} />
      <main className="custom-scrollbar relative h-dvh min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-white p-4 pt-20 dark:bg-[#111827] md:my-3 md:mr-3 md:ml-0 md:h-[calc(100vh-24px)] md:rounded-2xl md:border md:border-gray-200 md:p-6 md:shadow-sm md:dark:border-gray-800">
        {children}
      </main>
    </div>
  );
}
