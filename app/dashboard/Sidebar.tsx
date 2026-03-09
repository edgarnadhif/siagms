"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const menuGroups = [
    {
      title: "Menu",
      items: [
        { title: "Dashboard", href: "/dashboard", icon: "🏠" },
        { title: "Projek", href: "/dashboard/projek", icon: "📁" },
        { title: "Transaksi", href: "/dashboard/transaksi", icon: "💳" },
        { title: "Jurnal Umum", href: "/dashboard/jurnal-umum", icon: "📓" },
        { title: "Daftar Akun", href: "/dashboard/daftar-akun", icon: "📋" },
        { title: "Buku Besar", href: "/dashboard/buku-besar", icon: "📖" },
        { title: "Laporan Keuangan", href: "/dashboard/laporan", icon: "📊" },
      ],
    },
    {
      title: "Data",
      items: [
        { title: "Konsumen", href: "/dashboard/konsumen", icon: "👥" },
        { title: "Kuitansi", href: "/dashboard/kuitansi", icon: "🧾" },
      ],
    },
    {
      title: "Pengaturan",
      items: [
        { title: "Kelola User", href: "/dashboard/users", icon: "👤" },
        { title: "Profil Perusahaan", href: "/dashboard/profil", icon: "🏢" },
        { title: "Panduan", href: "/dashboard/panduan", icon: "📚" },
      ],
    },
  ];

  return (
    <div
      className={`bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 h-screen transition-all duration-300 flex flex-col shadow-xl border-r border-gray-200 dark:border-gray-800 p-3 pt-5 border-2 m-3 rounded-2xl  ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div
        className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"} px-4 pb-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f172a]`}
      >
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                Multi Griya
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Sejahtera
              </p>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
        >
          {isExpanded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 mx-auto"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {isExpanded && group.title && (
              <h3 className="px-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
            )}
            <ul className="">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className={`flex items-center  px-2 py-1 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      } ${!isExpanded ? "justify-center" : ""}`}
                      title={!isExpanded ? item.title : ""}
                    >
                      {isActive && isExpanded && (
                        <div className="absolute left-0 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-r-full -ml-3 opacity-0"></div>
                      )}
                      <span
                        className={`text-lg transition-colors ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100"}`}
                      >
                        {item.icon}
                      </span>
                      {isExpanded && (
                        <span className="ml-3 truncate text-sm">
                          {item.title}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-auto px-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <ul className="space-y-1">
            {mounted && (
              <li>
                <button
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                  className={`flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors group mb-1 ${
                    !isExpanded ? "justify-center" : ""
                  }`}
                  title={!isExpanded ? "Toggle Theme" : ""}
                >
                  <span className="text-lg transition-colors group-hover:text-yellow-500 dark:group-hover:text-yellow-400 text-gray-500 dark:text-gray-400">
                    {/* Sun for Dark Mode (to switch to light), Moon for Light Mode */}
                    {resolvedTheme === "dark" ? "☀️" : "🌙"}
                  </span>
                  {isExpanded && (
                    <span className="ml-3 truncate text-sm">
                      {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                    </span>
                  )}
                </button>
              </li>
            )}
            <li>
              <Link
                href="/login"
                className={`flex items-center px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group ${
                  !isExpanded ? "justify-center" : ""
                }`}
              >
                <span className="text-lg text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                  🚪
                </span>
                {isExpanded && (
                  <span className="ml-3 truncate text-sm">Logout</span>
                )}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
