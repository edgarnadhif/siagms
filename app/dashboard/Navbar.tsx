"use client";

export default function Navbar({ user }: { user?: { email: string; role: string; fullName?: string | null } | null }) {
  return (
    <header suppressHydrationWarning className="flex items-center justify-end h-20 px-8 bg-gray-100 dark:bg-[#0f172a] shadow-sm z-10 transition-colors duration-300  my-3 mr-3 rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        {/* Avatar Circle */}
        <div className="w-12 h-12 rounded-full bg-[#FFF0E6] dark:bg-[#431407] text-[#EA6C00] dark:text-[#F97316] font-bold flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-sm uppercase">
          {user?.fullName ? user.fullName.substring(0, 2) : (user?.email ? user.email.substring(0, 2) : "US")}
        </div>
        {/* User Info */}
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight break-all max-w-[150px] truncate">
            {user?.fullName || (user?.email ? user.email.split('@')[0] : "User")}
          </p>
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
            {user?.role || "STAFF"}
          </p>
        </div>
      </div>
    </header>
  );
}
