"use client";

import React, { useEffect } from "react";
import { useActionState } from "react";
import { updateAccount } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: string;
  description: string | null;
  isActive: boolean;
}

export default function EditAkunModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateAccount, null);
  const router = useRouter();

  const [code, setCode] = React.useState(account.code);
  const [type, setType] = React.useState(account.type);
  const [normalBalance, setNormalBalance] = React.useState(account.normalBalance);
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
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCode(val);

    if (val.length > 0) {
      const firstDigit = val[0];
      if (firstDigit === '1') { setType("ASET"); setNormalBalance("DEBIT"); }
      else if (firstDigit === '2') { setType("KEWAJIBAN"); setNormalBalance("KREDIT"); }
      else if (firstDigit === '3') { setType("EKUITAS"); setNormalBalance("KREDIT"); }
      else if (firstDigit === '4') { setType("PENDAPATAN"); setNormalBalance("KREDIT"); }
      else if (firstDigit === '5') { setType("BEBAN"); setNormalBalance("DEBIT"); }
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setType(val);
    if (val === "ASET" || val === "BEBAN") setNormalBalance("DEBIT");
    else if (val === "KEWAJIBAN" || val === "EKUITAS" || val === "PENDAPATAN") setNormalBalance("KREDIT");
  };

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state, router, onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Akun</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-[#EA6C00] hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form action={formAction}>
          <input type="hidden" name="id" value={account.id} />
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Kode Akun <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={code}
                  onChange={handleCodeChange}
                  pattern="^[1-5]\d{3}$"
                  title="Kode harus 4 digit angka (1100 - 5999)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Akun <span className="text-red-500">*</span>
                </label>
                <input type="hidden" name="type" value={type} />
                <div className="relative" ref={typeRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeOpen(!typeOpen);
                      setBalanceOpen(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] outline-none transition-shadow flex items-center justify-between"
                  >
                    <span>
                      {
                        TYPE_OPTIONS.find((option) => option.value === type)
                          ?.label
                      }
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-400 transition-transform ${typeOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {typeOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden p-1.5">
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
                          className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${type === option.value ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Akun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={account.name}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] placeholder-slate-400 outline-none transition-shadow"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Saldo Normal <span className="text-red-500">*</span>
              </label>
              <input type="hidden" name="normalBalance" value={normalBalance} />
              <div className="relative" ref={balanceRef}>
                <button
                  type="button"
                  onClick={() => {
                    setBalanceOpen(!balanceOpen);
                    setTypeOpen(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] outline-none transition-shadow flex items-center justify-between"
                >
                  <span>
                    {
                      BALANCE_OPTIONS.find(
                        (option) => option.value === normalBalance,
                      )?.label
                    }
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-slate-400 transition-transform ${balanceOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {balanceOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden p-1.5">
                    {BALANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setNormalBalance(option.value);
                          setBalanceOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${normalBalance === option.value ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Keterangan
              </label>
              <textarea
                name="description"
                defaultValue={account.description || ""}
                placeholder="Deskripsi akun (opsional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-[#EA6C00]/20 focus:border-[#EA6C00] placeholder-slate-400 resize-none outline-none transition-shadow"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAkunAktif"
                name="isActive"
                defaultChecked={account.isActive}
                className="w-4 h-4 text-[#EA6C00] border-gray-300 rounded focus:ring-[#EA6C00]/30 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="editAkunAktif" className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Akun Aktif
              </label>
            </div>

            {state?.error && (
              <div className="mt-4 text-red-500 text-xs font-medium p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-100 dark:border-red-800">
                {state.error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <button
              onClick={onClose}
              type="button"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-lg transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
