"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { logout, getCompanyProfile } from "@/app/actions";
import type { AppRole } from "@/lib/session";

export default function Sidebar({
  role,
  user,
}: {
  role: AppRole;
  user?: { email: string; role: string; fullName?: string | null } | null;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<{
    name: string;
    logoUrl: string | null;
  }>({ name: "SIAGMS", logoUrl: null });

  useEffect(() => {
    getCompanyProfile().then((profile) => {
      if (profile) {
        setCompanyProfile({
          name: profile.name || "SIAGMS",
          logoUrl: profile.logoUrl,
        });
      }
    });
  }, []);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const menuGroups = [
    {
      title: "Menu",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: "/dashboard.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Projek",
          href: "/dashboard/projek",
          icon: "/folder.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Transaksi",
          href: "/dashboard/transaksi",
          icon: "/credit_card.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Kalender",
          href: "/dashboard/calendar",
          icon: "/calendar_month.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Jurnal Umum",
          href: "/dashboard/jurnal-umum",
          icon: "/book_5.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Daftar Akun",
          href: "/dashboard/daftar-akun",
          icon: "/lists.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Buku Besar",
          href: "/dashboard/buku-besar",
          icon: "/library_books.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Neraca Saldo",
          href: "/dashboard/neraca-saldo",
          icon: "/balance.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Laporan Keuangan",
          href: "/dashboard/laporan",
          icon: "/finance_mode.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
      ],
    },
    {
      title: "Data Master",
      items: [
        {
          title: "Pelanggan",
          href: "/dashboard/pelanggan",
          icon: "/group.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
        {
          title: "Master Unit",
          href: "/dashboard/unit",
          icon: "/perumahan.svg",
          roles: ["ADMIN", "AKUNTAN"],
        },
      ],
    },
    {
      title: "Pengaturan",
      items: [
        {
          title: "Kelola User",
          href: "/dashboard/users",
          icon: "/person.svg",
          roles: ["ADMIN"],
        },
        {
          title: "Profil Perusahaan",
          href: "/dashboard/settings",
          icon: "/domain.svg",
          roles: ["ADMIN"],
        },
      ],
    },
  ]
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      suppressHydrationWarning
      className={`relative z-50 bg-white dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 h-[calc(100vh-24px)] transition-all duration-300 flex flex-col shadow-xl border-gray-200 dark:border-gray-800 p-3 pt-5 border-2 m-3 rounded-2xl ${
        isExpanded ? "w-64" : "w-20"
      }`}
    >
      <div
        className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"} px-4 pb-4 dark:bg-[#0f172a]`}
      >
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                {companyProfile.name}
              </h1>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className=" p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
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

      <nav
        suppressHydrationWarning
        className="flex-1 overflow-y-auto py-4 custom-scrollbar"
      >
        {menuGroups.map((group) => (
          <div suppressHydrationWarning key={group.title} className="mb-4">
            {isExpanded && group.title && (
              <h3 className="px-3 sidebar-section mb-2">{group.title}</h3>
            )}
            <ul className="">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const isStringIcon =
                  typeof item.icon === "string" && item.icon.startsWith("/");
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 shadow-sm sidebar-menu-active"
                          : "sidebar-menu hover:bg-white/50 dark:hover:bg-slate-800/50"
                      } ${!isExpanded ? "justify-center" : ""}`}
                      title={!isExpanded ? item.title : ""}
                    >
                      <span
                        className={`transition-colors flex-shrink-0 ${
                          isActive
                            ? "text-slate-900 dark:text-white"
                            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                        }`}
                      >
                        {isStringIcon ? (
                          <Image
                            src={item.icon as string}
                            alt={item.title}
                            width={20}
                            height={20}
                            className={`w-[18px] h-[18px] dark:invert ${isActive ? "opacity-100" : "opacity-40 group-hover:opacity-80"}`}
                          />
                        ) : (
                          item.icon
                        )}
                      </span>
                      {isExpanded && (
                        <span className="ml-3 truncate">{item.title}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-800 shrink-0">
        {isExpanded ? (
          /* Expanded: full user card row */
          <div className="relative">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-800 transition-colors">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#FFF0E6] dark:bg-[#431407] text-[#EA6C00] dark:text-[#F97316] font-bold text-sm flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm uppercase shrink-0">
                {user?.fullName ? user.fullName.substring(0, 2) : (user?.email ? user.email.substring(0, 2) : "US")}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                  {user?.fullName || (user?.email ? user.email.split("@")[0] : "User")}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981] shrink-0" />
                  {user?.role || "STAFF"}
                </p>
              </div>
              {/* ... menu button */}
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-gray-300/50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
                title="Opsi"
              >
                <svg
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
            </div>

            {/* Popover */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5">
                  {/* Tema */}
                  <button
                    onClick={() => {
                      setThemeDropdownOpen((v) => !v);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.813-3.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                      />
                    </svg>
                    Tema Aplikasi
                  </button>

                  {/* Sub-options for theme */}
                  {themeDropdownOpen && (
                    <div className="px-2 py-1 space-y-0.5">
                      {[
                        {
                          key: "light",
                          label: "Light Mode",
                          icon: "M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z",
                        },
                        {
                          key: "dark",
                          label: "Dark Mode",
                          icon: "M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z",
                        },
                        {
                          key: "system",
                          label: "System",
                          icon: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25",
                        },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setTheme(t.key);
                            setThemeDropdownOpen(false);
                            setUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                            theme === t.key
                              ? "bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d={t.icon}
                            />
                          </svg>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

                  {/* Logout */}
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors"
                  >
                    <Image
                      src="/logout.svg"
                      alt="Logout"
                      width={16}
                      height={16}
                      className="w-4 h-4 dark:invert opacity-70"
                    />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Collapsed: just avatar button that opens user menu */
          <div className="relative flex justify-center">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-10 h-10 rounded-full bg-[#FFF0E6] dark:bg-[#431407] text-[#EA6C00] dark:text-[#F97316] font-bold text-sm flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm uppercase hover:ring-2 hover:ring-[#EA6C00]/40 transition-all"
              title={user?.email || "User"}
            >
              {user?.fullName ? user.fullName.substring(0, 2) : (user?.email ? user.email.substring(0, 2) : "US")}
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute bottom-0 left-14 w-44 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setThemeDropdownOpen((v) => !v);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.813-3.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                      />
                    </svg>
                    Tema Aplikasi
                  </button>
                  <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 transition-colors"
                  >
                    <Image
                      src="/logout.svg"
                      alt="Logout"
                      width={16}
                      height={16}
                      className="w-4 h-4 dark:invert opacity-70"
                    />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
