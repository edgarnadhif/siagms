"use client";

import React, { useEffect } from "react";
import { useActionState } from "react";
import { createAccount } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function AddAkunModal({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error") => void;
}) {
  const [state, formAction, isPending] = useActionState(createAccount, null);
  const router = useRouter();

  const [code, setCode] = React.useState("");
  const [type, setType] = React.useState("");
  const [normalBalance, setNormalBalance] = React.useState("DEBIT");
  const [typeOpen, setTypeOpen] = React.useState(false);
  const [balanceOpen, setBalanceOpen] = React.useState(false);
  const typeRef = React.useRef<HTMLDivElement>(null);
  const balanceRef = React.useRef<HTMLDivElement>(null);

  const TYPE_OPTIONS = [
    { value: "ASET", label: "Aset (1xxx)" },
    { value: "KEWAJIBAN", label: "Kewajiban (2xxx)" },
    { value: "EKUITAS", label: "Ekuitas (3xxx)" },
    { value: "PENDAPATAN", label: "Pendapatan (4xxx)" },
    { value: "BEBAN", label: "Beban (5xxx)" },
  ];

  const BALANCE_OPTIONS = [
    { value: "DEBIT", label: "Debit" },
    { value: "KREDIT", label: "Kredit" },
  ];

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya izinkan angka max 4 digit
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(val);

    if (val.length > 0) {
      const firstDigit = val[0];
      if (firstDigit === "1") {
        setType("ASET");
        setNormalBalance("DEBIT");
      } else if (firstDigit === "2") {
        setType("KEWAJIBAN");
        setNormalBalance("KREDIT");
      } else if (firstDigit === "3") {
        setType("EKUITAS");
        setNormalBalance("KREDIT");
      } else if (firstDigit === "4") {
        setType("PENDAPATAN");
        setNormalBalance("KREDIT");
      } else if (firstDigit === "5") {
        setType("BEBAN");
        setNormalBalance("DEBIT");
      }
    }
  };

  useEffect(() => {
    if (state?.success) {
      if (showToast) showToast("Akun berhasil ditambahkan", "success");
      router.push("/dashboard/daftar-akun");
      router.refresh();
    }
  }, [state, router, showToast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setTypeOpen(false);
      }

      if (
        balanceRef.current &&
        !balanceRef.current.contains(event.target as Node)
      ) {
        setBalanceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    router.push("/dashboard/daftar-akun");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Tambah Akun
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form action={formAction} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  Kode Akun <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={code}
                  onChange={handleCodeChange}
                  pattern="^[1-5]\d{3}$"
                  title="Kode harus 4 digit angka (1100 - 5999)"
                  placeholder="Contoh: 1100"
                  className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                  Tipe Akun <span className="text-[#EA6C00]">*</span>
                </label>
                <input type="hidden" name="type" value={type} />
                <div className="relative" ref={typeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeOpen(!typeOpen);
                      setBalanceOpen(false);
                    }}
                    className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left ${
                      typeOpen
                        ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                        : "border-[#E5E7EB] dark:border-slate-600"
                    } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
                  >
                    <span className={type ? "" : "text-slate-400"}>
                      {type
                        ? TYPE_OPTIONS.find((option) => option.value === type)
                            ?.label
                        : "Pilih tipe"}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-4 h-4 text-slate-400 transition-transform ${typeOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {typeOpen && (
                    <div className="absolute z-[60] left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setType("");
                          setTypeOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${type === "" ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"}`}
                      >
                        Pilih tipe
                      </button>
                      {TYPE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setType(option.value);
                            if (
                              option.value === "ASET" ||
                              option.value === "BEBAN"
                            ) {
                              setNormalBalance("DEBIT");
                            } else {
                              setNormalBalance("KREDIT");
                            }
                            setTypeOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${type === option.value ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Nama Akun <span className="text-[#EA6C00]">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Nama akun"
                className="w-full px-4 h-12 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Saldo Normal <span className="text-[#EA6C00]">*</span>
              </label>
              <input type="hidden" name="normalBalance" value={normalBalance} />
              <div className="relative" ref={balanceRef}>
                <button
                  type="button"
                  onClick={() => {
                    setBalanceOpen(!balanceOpen);
                    setTypeOpen(false);
                  }}
                  className={`flex justify-between items-center w-full px-4 h-12 border rounded-xl text-sm transition-all text-left ${
                    balanceOpen
                      ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10"
                      : "border-[#E5E7EB] dark:border-slate-600"
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
                >
                  <span>
                    {
                      BALANCE_OPTIONS.find(
                        (option) => option.value === normalBalance,
                      )?.label
                    }
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 text-slate-400 transition-transform ${balanceOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {balanceOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden p-1.5">
                    {BALANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setNormalBalance(option.value);
                          setBalanceOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm transition-all rounded-xl ${normalBalance === option.value ? "bg-slate-50 dark:bg-slate-700/50 text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 font-medium"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-semibold text-gray-700 dark:text-slate-300 mb-1.5 leading-[1.5]">
                Keterangan
              </label>
              <textarea
                name="description"
                placeholder="Deskripsi akun (opsional)"
                rows={3}
                className="w-full px-4 py-3 min-h-24 border border-[#E5E7EB] dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400 resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="akunAktif"
                name="isActive"
                defaultChecked
                className="w-4 h-4 text-[#EA6C00] border-gray-300 rounded focus:ring-[#EA6C00]/30 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="akunAktif"
                className="text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Akun Aktif
              </label>
            </div>

            {state?.error && (
              <div className="text-red-600 text-xs font-bold p-3 bg-red-50 dark:bg-red-900/20 rounded-[8px] border border-red-100 dark:border-red-900/30">
                {state.error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-5 border-t border-[#F3F4F6] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <button
              onClick={handleClose}
              type="button"
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <div className="flex items-center gap-2 text-white">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </div>
              ) : (
                "Tambah Akun"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
