"use client";

import React, { useEffect, useState } from "react";
import { serahTerimaUnit } from "@/app/actions";
import { useActionState } from "react";

interface UnitDetailModalProps {
  unitId: string;
  onClose: () => void;
}

export default function UnitDetailModal({ unitId, onClose }: UnitDetailModalProps) {
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSTForm, setShowSTForm] = useState(false);
  
  const [stState, stAction, isStPending] = useActionState(serahTerimaUnit, null);

  useEffect(() => {
    fetchUnitDetail();
  }, [unitId]);

  useEffect(() => {
    if (stState?.success) {
      fetchUnitDetail();
      setShowSTForm(false);
    }
  }, [stState]);

  const fetchUnitDetail = async () => {
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
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-slate-500 animate-pulse font-medium">Memuat Detail Unit...</p>
        </div>
      </div>
    );
  }

  if (!unit) return null;

  const totalPrice = Number(unit.price);
  const totalPaid = unit.transactions.reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const remaining = Math.max(0, totalPrice - totalPaid);
  const payPercent = Math.min(100, Math.round((totalPaid / totalPrice) * 100));
  const isFullyPaid = payPercent >= 100;

  const getStatusStep = (status: string) => {
    const steps = ['TERSEDIA', 'BOOKING', 'INDENT', 'AKAD', 'LUNAS', 'SERAH_TERIMA'];
    return steps.indexOf(status);
  };

  const currentStep = getStatusStep(unit.status);

  const timelineSteps = [
    { id: 'BOOKING', label: 'Booking', desc: 'Unit telah dibooking' },
    { id: 'INDENT', label: 'Indent/DP', desc: 'Pembayaran DP dimulai' },
    { id: 'AKAD', label: 'Akad', desc: 'Tanda tangan akad jual beli' },
    { id: 'SERAH_TERIMA', label: 'Serah Terima', desc: 'Unit diserahkan ke pembeli' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden border border-white/20 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-orange-500 transition-colors rounded-full hover:bg-white dark:hover:bg-slate-700 shadow-sm border border-transparent hover:border-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Payment Progress */}
            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Pembayaran</p>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Rp {new Intl.NumberFormat('id-ID').format(totalPaid)} 
                    <span className="text-sm font-medium text-slate-400 ml-2">/ Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}</span>
                  </h3>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tagihan</p>
                   <p className="text-lg font-black text-orange-600">Rp {new Intl.NumberFormat('id-ID').format(remaining)}</p>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2 relative">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-all duration-1000 ease-out"
                  style={{ width: `${payPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>{payPercent}% TERBAYAR</span>
                <span>{unit.status}</span>
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
                       <span className="font-bold">{unit.customer?.paymentMethod || "-"}</span>
                    </div>
                    {unit.customer?.paymentMethod === 'KPR' && (
                       <div className="flex justify-between">
                          <span>Bank</span>
                          <span className="font-bold">{unit.customer?.bankName || "-"}</span>
                       </div>
                    )}
                 </div>
               </div>
               <svg className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
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
                      const isHandover = step.id === 'SERAH_TERIMA';
                      return (
                        <div key={step.id} className="flex flex-col items-center group">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                              isActive 
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40 ring-4 ring-orange-500/20" 
                                : "bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 text-gray-400"
                           }`}>
                              {isActive ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                              ) : <span className="text-xs font-bold">{idx + 1}</span>}
                           </div>
                           <div className="mt-3 text-center">
                              <p className={`text-xs font-bold transition-colors ${isActive ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>{step.label}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[80px] leading-tight">{step.desc}</p>
                           </div>
                        </div>
                      )
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
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                   <div className="divide-y divide-gray-100 dark:divide-slate-700">
                      {unit.transactions.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm italic">Belum ada catatan transaksi</div>
                      ) : unit.transactions.map((t: any) => (
                        <div key={t.id} className="p-4 flex justify-between items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                           <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{t.description}</p>
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {t.category}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-emerald-600">+ Rp {new Intl.NumberFormat('id-ID').format(Number(t.amount))}</p>
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
                   Serah Terima Unit
                </h3>
                
                {unit.status === 'SERAH_TERIMA' ? (
                   <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/10">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Unit Telah Diserahterimakan</h4>
                      <p className="text-sm text-emerald-600/80 mt-1">Pendapatan telah diakui dalam sistem akuntansi secara otomatis.</p>
                   </div>
                ) : !isFullyPaid ? (
                   <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 p-8 rounded-3xl flex flex-col items-center text-center">
                      <p className="text-slate-400 text-sm font-medium">Selesaikan pelunasan 100% untuk mengaktifkan fitur Serah Terima.</p>
                   </div>
                ) : !showSTForm ? (
                   <button 
                     onClick={() => setShowSTForm(true)}
                     className="w-full py-6 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-3xl font-black text-lg shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                   >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .415.162.798.425 1.081.263.283.65.454 1.075.454s.812-.171 1.075-.454c.263-.283.425-.666.425-1.081 0-.231-.035-.454-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.33.153-.635.351-.904.586m6.705 0c.269-.235.574-.433.904-.586m-6.705 0a2.25 2.25 0 011.971-.243M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>
                      PROSES SERAH TERIMA
                   </button>
                ) : (
                   <form action={stAction} className="bg-white dark:bg-slate-800 border-2 border-orange-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
                      <input type="hidden" name="unitId" value={unitId} />
                      <input type="hidden" name="customerId" value={unit.customerId} />
                      
                      <div>
                         <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">No. Berita Acara <span className="text-orange-500">*</span></label>
                         <input type="text" name="handoverNo" required placeholder="Contoh: BA-ST/2026/001" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white" />
                      </div>
                      <div>
                         <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tanggal ST <span className="text-orange-500">*</span></label>
                         <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all dark:text-white" />
                      </div>

                      {stState?.error && (
                         <div className="text-red-500 text-xs font-bold p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">{stState.error}</div>
                      )}

                      <div className="flex gap-2 pt-2">
                         <button type="button" onClick={() => setShowSTForm(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Batal</button>
                         <button type="submit" disabled={isStPending} className="flex-[2] py-3 text-sm font-black text-white bg-orange-600 hover:bg-orange-700 rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50">
                            {isStPending ? "Memproses..." : "Konfirmasi ST"}
                         </button>
                      </div>
                   </form>
                )}

                <div className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-3xl">
                   <div className="flex gap-3">
                      <div className="text-blue-500 mt-0.5">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                      </div>
                      <div>
                         <p className="text-xs font-bold text-blue-800 dark:text-blue-400">INFO AKUNTANSI</p>
                         <p className="text-[11px] text-blue-600/80 leading-relaxed mt-1 font-medium italic">Sistem akan otomatis melakukan pengakuan pendapatan (sebesar harga unit) saat proses serah terima diproses.</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 text-center shrink-0">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{unit.id} • SIAGMS PROPERTY ENGINE v2.0</p>
        </div>
      </div>
    </div>
  );
}
