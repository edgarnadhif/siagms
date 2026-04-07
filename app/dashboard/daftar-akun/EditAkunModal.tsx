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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Akun</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Akun <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  required
                  value={type}
                  onChange={handleTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none transition-shadow"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                    backgroundSize: "16px 16px",
                    backgroundPosition: "right 12px center",
                    backgroundRepeat: "no-repeat",
                    paddingRight: "40px",
                  }}
                >
                  <option value="ASET">Aset (1xxx)</option>
                  <option value="KEWAJIBAN">Kewajiban (2xxx)</option>
                  <option value="EKUITAS">Ekuitas (3xxx)</option>
                  <option value="PENDAPATAN">Pendapatan (4xxx)</option>
                  <option value="BEBAN">Beban (5xxx)</option>
                </select>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 outline-none transition-shadow"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Saldo Normal <span className="text-red-500">*</span>
              </label>
              <select
                name="normalBalance"
                required
                value={normalBalance}
                onChange={(e) => setNormalBalance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none outline-none transition-shadow"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                  backgroundSize: "16px 16px",
                  backgroundPosition: "right 12px center",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "40px",
                }}
              >
                <option value="DEBIT">Debit</option>
                <option value="KREDIT">Kredit</option>
              </select>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 resize-none outline-none transition-shadow"
              ></textarea>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editAkunAktif"
                name="isActive"
                defaultChecked={account.isActive}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
