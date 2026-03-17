"use client";

export default function Navbar() {
  return (
    <header className="flex items-center justify-end h-20 px-8 bg-gray-100 dark:bg-[#0f172a] shadow-sm z-10 transition-colors duration-300  my-3 mr-3 rounded-2xl border border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-3">
        {/* Avatar Circle */}
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shadow-sm"></div>

        {/* User Info */}
        <div className="text-left">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            Edgar Nadhif
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Akuntan</p>
        </div>
      </div>
    </header>
  );
}
