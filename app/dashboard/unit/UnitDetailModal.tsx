"use client";

import React, { useEffect, useState, useCallback } from "react";
import { serahTerimaUnit } from "@/app/actions";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import CategoryBadge from "@/components/ui/CategoryBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { TransactionCategory } from "@prisma/client";

interface UnitDetailModalProps {
  unitId: string;
  onClose: () => void;
  onCancelSuccess?: (updatedUnitId: string) => void;
}

const ST_REVENUE_CATEGORIES = ["BOOKING_FEE", "DOWN_PAYMENT", "PENCAIRAN_KPR", "PELUNASAN_CASH"] as const;

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

// ─── Toast ─────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast { id: number; message: string; type: ToastType }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white min-w-[280px] max-w-[380px] animate-in slide-in-from-right-5 duration-300 ${
            t.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {t.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span className="flex-1 leading-tight">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-white/70 hover:text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Cancel Confirm Modal ────────────────────────────────────────────────────
interface CancelModalProps {
  unit: any;
  totalBF: number;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function CancelPurchaseModal({ unit, totalBF, onClose, onSuccess }: CancelModalProps) {
  const [alasan, setAlasan] = useState("");
  const [tanggalBatal, setTanggalBatal] = useState(new Date().toISOString().split("T")[0]);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedBF = new Intl.NumberFormat("id-ID").format(totalBF);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (alasan.trim().length < 10) {
      setError("Alasan pembatalan wajib diisi minimal 10 karakter");
      return;
    }
    if (!confirmed) {
      setError("Anda harus mencentang checkbox konfirmasi terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unit.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan, tanggalBatal }),
      });
      const json = await res.json();
      if (json.success) {
        onSuccess(json.message);
      } else {
        setError(json.message);
      }
    } catch {
      setError("Terjadi kesalahan sistem. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-slate-700 bg-red-50 dark:bg-red-950/30">
          <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Batalkan Pembelian</h3>

          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Ringkasan */}
            <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2.5">
              <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Ringkasan Pembatalan</h4>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Unit</span>
                <span className="font-bold text-slate-800 dark:text-white">{unit.unitCode} — Blok {unit.blockName} No.{unit.unitNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Pelanggan</span>
                <span className="font-bold text-slate-800 dark:text-white">{unit.customer?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-700 pt-2.5 mt-2">
                <span className="text-slate-500 font-medium">Total BF Masuk</span>
                <span className={`font-black text-base ${totalBF > 0 ? "text-red-600" : "text-slate-400"}`}>
                  Rp {formattedBF}
                </span>
              </div>
              {totalBF > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg px-3 py-2">
                  ⚠️ Booking Fee sebesar Rp {formattedBF} akan dicatat sebagai <strong>Pendapatan Lain-lain (akun 4200)</strong> dan tidak dikembalikan ke pembeli.
                </p>
              )}
            </div>

            {/* Tanggal Pembatalan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Tanggal Pembatalan *
              </label>
              <input
                type="date"
                value={tanggalBatal}
                onChange={(e) => setTanggalBatal(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 outline-none transition-all"
              />
            </div>

            {/* Alasan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan * <span className="normal-case font-normal text-gray-400">(min. 10 karakter)</span>
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                placeholder="Masukkan alasan pembatalan pembelian..."
                required
                className="w-full p-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-red-500/10 focus:border-red-400 outline-none transition-all placeholder-gray-400 resize-none"
              />
              <p className={`text-[11px] mt-1 font-medium ${alasan.length < 10 && alasan.length > 0 ? "text-red-500" : "text-gray-400"}`}>
                {alasan.length} / minimal 10 karakter
              </p>
            </div>

            {/* Checkbox konfirmasi */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    confirmed
                      ? "bg-red-600 border-red-600"
                      : "border-gray-300 dark:border-slate-600 group-hover:border-red-400"
                  }`}
                >
                  {confirmed && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Saya mengerti bahwa Booking Fee sebesar{" "}
                <strong className="text-red-600">Rp {formattedBF}</strong>{" "}
                tidak akan dikembalikan ke pembeli dan akan dicatat sebagai pendapatan lain-lain.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !confirmed || alasan.trim().length < 10}
              className="flex-[2] h-11 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  Konfirmasi Pembatalan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AkadProcessModalProps {
  unit: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function AkadProcessModal({ unit, onClose, onSuccess }: AkadProcessModalProps) {
  const [tanggalAkad, setTanggalAkad] = useState(new Date().toISOString().split("T")[0]);
  const [namaBank, setNamaBank] = useState(unit.customer?.bankName || "");
  const [nomorAkad, setNomorAkad] = useState("");
  const [nilaiKPR, setNilaiKPR] = useState(String(Number(unit.customer?.kprAmount || 0) || ""));
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!tanggalAkad || !namaBank.trim() || !nomorAkad.trim() || !nilaiKPR || Number(nilaiKPR) <= 0) {
      setError("Tanggal akad, nama bank, nomor akad, dan nilai KPR wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/units/${unit.id}/akad`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggalAkad,
          namaBank,
          nomorAkad,
          nilaiKPR: Number(nilaiKPR),
          catatan,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.message);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Terjadi kesalahan sistem. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center gap-4 p-6 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/30">
          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 6.75h7.5m-7.5 4.5h7.5m-7.5 4.5h4.5M3.75 5.25A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0118 21H6a2.25 2.25 0 01-2.25-2.25V5.25z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300">Proses Akad KPR</h3>
            <p className="text-sm text-orange-700/80 dark:text-orange-400/80 mt-0.5">Simpan data akad sebelum pencairan KPR diproses.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tanggal Akad *</label>
                <input type="date" value={tanggalAkad} onChange={(e) => setTanggalAkad(e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nama Bank *</label>
                <input type="text" value={namaBank} onChange={(e) => setNamaBank(e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nomor Akad *</label>
                <input type="text" value={nomorAkad} onChange={(e) => setNomorAkad(e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nilai KPR Disetujui *</label>
                <input type="number" min="1" value={nilaiKPR} onChange={(e) => setNilaiKPR(e.target.value)} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" required />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Catatan</label>
              <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} className="w-full p-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none" placeholder="Catatan tambahan akad (opsional)" />
            </div>

            {error && <div className="text-red-500 text-xs font-bold p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">{error}</div>}
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-[2] h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all">
              {loading ? "Memproses..." : "Konfirmasi Akad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function UnitDetailModal({ unitId, onClose, onCancelSuccess }: UnitDetailModalProps) {
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSTForm, setShowSTForm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAkadModal, setShowAkadModal] = useState(false);
  const router = useRouter();

  const [stState, stAction, isStPending] = useActionState(serahTerimaUnit, null);

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = React.useRef(0);
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  const removeToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const fetchUnitDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unitId}`);
      const json = await res.json();
      if (json.success) {
        setUnit(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    fetchUnitDetail();
  }, [fetchUnitDetail]);

  useEffect(() => {
    if (stState?.success) {
      fetchUnitDetail();
      setShowSTForm(false);
      showToast(stState.message || "Serah terima berhasil diproses.", "success");
    }
  }, [fetchUnitDetail, showToast, stState]);

  const handleCancelSuccess = (msg: string) => {
    setShowCancelModal(false);
    showToast(msg, "success");
    // Refresh unit data
    fetchUnitDetail();
    // Notify parent if needed
    onCancelSuccess?.(unitId);
  };

  const handleAkadSuccess = (msg: string) => {
    setShowAkadModal(false);
    showToast(msg, "success");
    fetchUnitDetail();
    onCancelSuccess?.(unitId);
  };

  const handleSTSubmitConfirm = (event: React.FormEvent<HTMLFormElement>) => {
    if (!canProcessST) {
      event.preventDefault();
      return;
    }

    const confirmationMessage = [
      `Total pendapatan yang akan diakui: ${formatRupiah(stBreakdown.total)}`,
      `- Booking Fee    : ${formatRupiah(stBreakdown.bookingFee)}`,
      `- Down Payment   : ${formatRupiah(stBreakdown.downPayment)}`,
      `- Pencairan KPR  : ${formatRupiah(stBreakdown.pencairanKpr)}`,
      `- Pelunasan Cash : ${formatRupiah(stBreakdown.pelunasanCash)}`,
      "--------------------------------",
      `Total            : ${formatRupiah(stBreakdown.total)}`,
      "",
      "Konfirmasi serah terima?"
    ].join("\n");

    if (!window.confirm(confirmationMessage)) {
      event.preventDefault();
    }
  };

  if (loading) {
    return (
      <>
        <ToastContainer toasts={toasts} remove={removeToast} />
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 animate-pulse font-medium">Memuat Detail Unit...</p>
          </div>
        </div>
      </>
    );
  }

  if (!unit) return null;

  const totalPrice = Number(unit.price);
  const latestAkad = unit.akadRecords?.[0] || null;
  const totalPaid = unit.transactions.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const totalBF = unit.transactions
    .filter((t: any) => t.category === "BOOKING_FEE")
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const stBreakdown = unit.transactions.reduce(
    (acc: { bookingFee: number; downPayment: number; pencairanKpr: number; pelunasanCash: number; total: number }, transaction: any) => {
      if (!ST_REVENUE_CATEGORIES.includes(transaction.category)) {
        return acc;
      }

      const amount = Number(transaction.amount);
      if (transaction.category === "BOOKING_FEE") acc.bookingFee += amount;
      if (transaction.category === "DOWN_PAYMENT") acc.downPayment += amount;
      if (transaction.category === "PENCAIRAN_KPR") acc.pencairanKpr += amount;
      if (transaction.category === "PELUNASAN_CASH") acc.pelunasanCash += amount;
      acc.total += amount;
      return acc;
    },
    { bookingFee: 0, downPayment: 0, pencairanKpr: 0, pelunasanCash: 0, total: 0 }
  );
  const remaining = Math.max(0, totalPrice - totalPaid);
  const payPercent = Math.min(100, Math.round((totalPaid / totalPrice) * 100));
  const isFullyPaid = payPercent >= 100;
  const canProcessST = isFullyPaid && stBreakdown.total > 0;

  const CANCELLABLE_STATUSES = ["BOOKING", "INDENT"];
  const canCancel = CANCELLABLE_STATUSES.includes(unit.status);
  const canProcessAkad = unit.status === "INDENT";
  const sudahCair = unit.transactions.some((t: any) => t.category === "PENCAIRAN_KPR");
  const canInputPencairan = unit.status === "AKAD" && latestAkad && !sudahCair;

  const getStatusStep = (status: string) => {
    const steps = ["TERSEDIA", "BOOKING", "INDENT", "AKAD", "LUNAS", "SERAH_TERIMA"];
    return steps.indexOf(status);
  };

  const timelineSteps = [
    { id: "BOOKING", label: "Booking", desc: "Unit telah dibooking" },
    { id: "INDENT", label: "Indent/DP", desc: "Pembayaran DP dimulai" },
    { id: "AKAD", label: "Akad", desc: "Tanda tangan akad jual beli" },
    { id: "SERAH_TERIMA", label: "Serah Terima", desc: "Unit diserahkan ke pembeli" },
  ];

  return (
    <>
      <ToastContainer toasts={toasts} remove={removeToast} />

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelPurchaseModal
          unit={unit}
          totalBF={totalBF}
          onClose={() => setShowCancelModal(false)}
          onSuccess={handleCancelSuccess}
        />
      )}

      {showAkadModal && (
        <AkadProcessModal
          unit={unit}
          onClose={() => setShowAkadModal(false)}
          onSuccess={handleAkadSuccess}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 dark:border-slate-700 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M21 21h-18V3.545m18 0V3.545M3 3.545L12 3m0 0l9 .545M3 3.545L3 3m18 .545V3" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{unit.unitCode}</h2>
                <p className="text-sm text-slate-500 font-medium">Blok {unit.blockName} No.{unit.unitNumber} • {unit.project?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Batalkan Pembelian Button */}
              {canCancel && unit.customer && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524L13.477 14.89zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                  Batalkan Pembelian
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Top Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Payment Progress */}
              <div className="md:col-span-2 bg-slate-100 dark:bg-slate-800/80 rounded-3xl p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Pembayaran</p>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Rp {new Intl.NumberFormat("id-ID").format(totalPaid)}
                      <span className="text-sm font-medium text-slate-400 ml-2">/ Rp {new Intl.NumberFormat("id-ID").format(totalPrice)}</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tagihan</p>
                    <p className="text-lg font-black text-orange-600">Rp {new Intl.NumberFormat("id-ID").format(remaining)}</p>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2 relative">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                    style={{ width: `${payPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                  <span>{payPercent}% TERBAYAR</span>
                  <StatusBadge status={unit.status} variant="UNIT" size="sm" />
                </div>
              </div>

              {/* Customer Brief */}
              <div className="bg-orange-600 text-white rounded-3xl p-6 shadow-xl shadow-orange-500/20 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Pelanggan</p>
                  <h4 className="text-lg font-bold mb-4">{unit.customer?.name || "Belum ada pembeli"}</h4>
                  <div className="space-y-2 text-sm opacity-90">
                    <div className="flex justify-between border-b border-white/20 pb-2">
                      <span>Metode</span>
                      <span className="font-bold">{unit.customer?.paymentMethod || "—"}</span>
                    </div>
                    {unit.customer?.paymentMethod === "KPR" && (
                      <>
                        <div className="flex justify-between">
                          <span>Bank</span>
                          <span className="font-bold">{latestAkad?.namaBank || unit.customer?.bankName || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Plafon</span>
                          <span className="font-bold">Rp {new Intl.NumberFormat("id-ID").format(Number(latestAkad?.nilaiKPR || unit.customer?.kprAmount || 0))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>

            {/* Timeline Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Timeline Unit
              </h3>
              <div className="relative pt-8 pb-4">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 dark:bg-slate-700 -translate-y-1/2 z-0" />
                <div className="flex justify-between relative z-10">
                  {timelineSteps.map((step, idx) => {
                    const isActive = getStatusStep(unit.status) >= getStatusStep(step.id);
                    return (
                      <div key={step.id} className="flex flex-col items-center group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                          isActive
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20"
                            : "bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-400"
                        }`}>
                          {isActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <p className={`text-xs font-bold transition-colors ${isActive ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{step.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 max-w-[80px] leading-tight">{step.desc}</p>
                          {step.id === "AKAD" && canProcessAkad && (
                            <button
                              onClick={() => setShowAkadModal(true)}
                              className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white transition-all"
                            >
                              Proses Akad KPR
                            </button>
                          )}
                          {step.id === "AKAD" && canInputPencairan && (
                            <button
                              onClick={() => router.push(`/dashboard/transaksi?add=true&category=PENCAIRAN_KPR&unitId=${unit.id}&projectId=${unit.projectId}&customerId=${unit.customerId}`)}
                              className="mt-2 px-3 py-1.5 rounded-lg text-[10px] font-black bg-orange-500 text-white hover:bg-orange-600 transition-all"
                            >
                              Input Pencairan KPR
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* History Log */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Riwayat Pembayaran
                </h3>
                <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {unit.transactions.length === 0 ? (
                      <div className="p-10 text-center text-slate-400 text-sm italic">Belum ada catatan transaksi</div>
                    ) : unit.transactions.map((t: any) => (
                      <div key={t.id} className="p-4 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                              {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <CategoryBadge category={t.category as TransactionCategory} size="sm" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-600">+ Rp {new Intl.NumberFormat("id-ID").format(Number(t.amount))}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-tighter">LUNAS</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ST / Handover Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Data Akad
                </h3>

                {latestAkad ? (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 p-5 rounded-3xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tanggal Akad</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {new Date(latestAkad.tanggalAkad).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Nomor Akad</span>
                      <span className="font-bold text-slate-800 dark:text-white">{latestAkad.nomorAkad}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Bank</span>
                      <span className="font-bold text-slate-800 dark:text-white">{latestAkad.namaBank}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Nilai KPR</span>
                      <span className="font-black text-orange-600">Rp {new Intl.NumberFormat("id-ID").format(Number(latestAkad.nilaiKPR))}</span>
                    </div>
                    {latestAkad.catatan && (
                      <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-900/50 border border-orange-100 dark:border-orange-900/20 rounded-xl px-3 py-2">
                        {latestAkad.catatan}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 p-5 rounded-3xl text-sm text-slate-400">
                    Data akad belum dicatat untuk unit ini.
                  </div>
                )}

                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                  Serah Terima Unit
                </h3>

                {unit.status === "SERAH_TERIMA" ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Unit Telah Diserahterimakan</h4>
                    <p className="text-sm text-emerald-600/80 mt-1">Pendapatan telah diakui dalam sistem akuntansi secara otomatis.</p>
                  </div>
                ) : !latestAkad && unit.customer?.paymentMethod === "KPR" ? (
                  <div className="bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-3xl flex flex-col items-center text-center">
                    <p className="text-slate-400 text-sm font-medium">Catat data akad KPR terlebih dahulu sebelum proses pencairan dan serah terima.</p>
                  </div>
                ) : !isFullyPaid ? (
                  <div className="bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-3xl flex flex-col items-center text-center">
                    <p className="text-slate-400 text-sm font-medium">Selesaikan pelunasan 100% untuk mengaktifkan fitur Serah Terima.</p>
                    {canInputPencairan && (
                      <button
                        onClick={() => router.push(`/dashboard/transaksi?add=true&category=PENCAIRAN_KPR&unitId=${unit.id}&projectId=${unit.projectId}&customerId=${unit.customerId}`)}
                        className="mt-4 px-5 h-11 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all"
                      >
                        Input Pencairan KPR
                      </button>
                    )}
                  </div>
                ) : stBreakdown.total <= 0 ? (
                  <div className="bg-slate-100 dark:bg-slate-800/80 border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-3xl flex flex-col items-center text-center">
                    <p className="text-slate-400 text-sm font-medium">Belum ada Booking Fee, Down Payment, Pencairan KPR, atau Pelunasan Cash yang bisa diakui saat serah terima.</p>
                  </div>
                ) : !showSTForm ? (
                  <button
                    onClick={() => setShowSTForm(true)}
                    className="w-full py-6 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .415.162.798.425 1.081.263.283.65.454 1.075.454s.812-.171 1.075-.454c.263-.283.425-.666.425-1.081 0-.231-.035-.454-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.33.153-.635.351-.904.586m6.705 0c.269-.235.574-.433.904-.586m-6.705 0a2.25 2.25 0 011.971-.243M12 21a9 9 0 100-18 9 9 0 000 18z" />
                    </svg>
                    PROSES SERAH TERIMA
                  </button>
                ) : (
                  <form action={stAction} onSubmit={handleSTSubmitConfirm} className="bg-white dark:bg-slate-800 border-2 border-orange-500/20 p-6 rounded-[24px] space-y-4 shadow-xl">
                    <input type="hidden" name="unitId" value={unitId} />
                    <input type="hidden" name="customerId" value={unit.customerId} />
                    <div className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50/70 dark:bg-orange-950/20 p-4 space-y-3">
                      <div>
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em]">Konfirmasi Pengakuan Pendapatan</p>
                        <h4 className="text-base font-black text-slate-800 dark:text-white mt-1">
                          Total pendapatan yang akan diakui: {formatRupiah(stBreakdown.total)}
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Booking Fee</span>
                          <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(stBreakdown.bookingFee)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Down Payment</span>
                          <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(stBreakdown.downPayment)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Pencairan KPR</span>
                          <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(stBreakdown.pencairanKpr)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Pelunasan Cash</span>
                          <span className="font-bold text-slate-800 dark:text-white">{formatRupiah(stBreakdown.pelunasanCash)}</span>
                        </div>
                      </div>
                      <div className="border-t border-orange-200 dark:border-orange-900/30 pt-3 flex items-center justify-between gap-4">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">Total</span>
                        <span className="text-lg font-black text-orange-600">{formatRupiah(stBreakdown.total)}</span>
                      </div>
                      <p className="text-[11px] font-medium text-orange-700/80 dark:text-orange-300/80">
                        Konfirmasi serah terima akan membuat jurnal Debit 2100 dan Kredit 4100 sebesar total penerimaan unit ini.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                        No. Berita Acara <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input type="text" name="handoverNo" required placeholder="Contoh: BA-ST/2026/001" className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-[10px] text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                        Tanggal ST <span className="text-[#EA6C00]">*</span>
                      </label>
                      <input type="date" name="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-[10px] text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
                    </div>
                    {stState?.error && (
                      <div className="text-red-500 text-xs font-bold p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">{stState.error}</div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setShowSTForm(false)} className="flex-1 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                      <button type="submit" disabled={isStPending || !canProcessST} className="flex-[2] h-11 text-sm font-black text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50">
                        {isStPending ? "Memproses..." : "Konfirmasi ST"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-3xl">
                  <div className="flex gap-3">
                    <div className="text-blue-500 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-800 dark:text-blue-400">INFO AKUNTANSI</p>
                      <p className="text-[11px] text-blue-600/80 leading-relaxed mt-1 font-medium italic">Sistem akan otomatis melakukan pengakuan pendapatan berdasarkan total penerimaan unit yang sudah masuk: Booking Fee, Down Payment, Pencairan KPR, dan Pelunasan Cash.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Riwayat Pembatalan ───────────────────────────────────────────── */}
            {unit.cancellations && unit.cancellations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  Riwayat Pembatalan
                  <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                    {unit.cancellations.length}x
                  </span>
                </h3>
                <div className="bg-red-50/50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                  <div className="divide-y divide-red-100 dark:divide-red-900/20">
                    {unit.cancellations.map((c: any) => (
                      <div key={c.id} className="p-5">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{c.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                              {c.customerCode} • Dibatalkan {new Date(c.tanggalBatal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          </div>
                          {Number(c.totalBFHangus) > 0 && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-slate-400 font-medium">BF Hangus</p>
                              <p className="text-sm font-black text-red-600">
                                Rp {new Intl.NumberFormat("id-ID").format(Number(c.totalBFHangus))}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900/20">
                          <p className="text-[11px] text-slate-500 font-medium">
                            <span className="font-bold text-slate-600 dark:text-slate-400">Alasan: </span>
                            {c.alasan}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-center shrink-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{unit.id} • SIAGMS PROPERTY ENGINE v2.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
