"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PelangganClient({ initialData }: { initialData: any[] }) {
  const [customers, setCustomers] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("SEMUA");
  const [showModal, setShowModal] = useState(false);
  const [payDropdownOpen, setPayDropdownOpen] = useState(false);
  const payFilterRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    nik: "",
    phone: "",
    email: "",
    address: "",
    paymentMethod: "CASH",
    bankName: "",
    kprAccountNo: "",
    kprAmount: "",
    kprTenor: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (payFilterRef.current && !payFilterRef.current.contains(event.target as Node)) {
        setPayDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.nik.includes(searchTerm);
    const matchesPayment = paymentFilter === "SEMUA" || c.paymentMethod === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          kprAmount: formData.kprAmount ? parseFloat(formData.kprAmount) : null,
          kprTenor: formData.kprTenor ? parseInt(formData.kprTenor) : null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        router.refresh();
        window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (e: any) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 pt-4 md:p-5 md:pt-5 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Master Pelanggan
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-3">
            Kelola data pelanggan dan metode pembayaran
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Pelanggan
        </button>
      </div>

      <div className="px-4 md:px-0 pb-10">
        <div className="sticky top-0 z-30 pt-2 pb-4 bg-gray-100 dark:bg-[#0f172a] -mx-4 md:-mx-0 px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all p-1.5 min-h-[56px] md:h-14">
            <div className="flex flex-1 items-center px-3 gap-3 w-full h-full min-h-[44px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-gray-400 flex-shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Cari nama atau NIK..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 font-medium"
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="hidden md:block h-6 w-[1px] bg-gray-100 dark:bg-slate-700 mx-1" />

            <div className="relative w-full md:w-auto" ref={payFilterRef}>
              <button
                type="button"
                onClick={() => setPayDropdownOpen(!payDropdownOpen)}
                className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>{paymentFilter === "SEMUA" ? "Semua Metode" : (paymentFilter === "CASH" ? "CASH KERAS" : "KPR")}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${payDropdownOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {payDropdownOpen && (
                <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  {[
                    { val: "SEMUA", label: "Semua Metode" },
                    { val: "CASH", label: "CASH KERAS" },
                    { val: "KPR", label: "KPR" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => {
                        setPaymentFilter(opt.val);
                        setPayDropdownOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-bold rounded-lg transition-all ${
                        paymentFilter === opt.val
                          ? "bg-[#EA6C00]/10 text-[#EA6C00]"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama & Kontak</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">NIK</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metode</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Terkait</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <p className="text-gray-400 font-medium">Tidak ada data pelanggan ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#EA6C00]">{c.customerCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#EA6C00] transition-colors">{c.name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{c.nik}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                          c.paymentMethod === 'KPR' 
                            ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {c.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.unit ? (
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                             <span className="text-gray-700 dark:text-gray-300 font-bold">{c.unit.unitCode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300 dark:text-slate-600 font-black italic uppercase tracking-wider">Tanpa Unit</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 text-xs font-bold text-[#EA6C00] bg-[#EA6C00]/10 hover:bg-[#EA6C00] hover:text-white rounded-lg transition-all">
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Pelanggan Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" placeholder="Masukkan nama..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">NIK (16 Digit) *</label>
                    <input type="text" required pattern="\d{16}" title="NIK harus 16 digit angka" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value.replace(/\D/g, '').slice(0, 16)})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" placeholder="0000000000000000" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">No HP *</label>
                    <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" placeholder="08..." />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" placeholder="email@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Alamat Lengkap *</label>
                    <textarea required rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" placeholder="Masukkan alamat..." />
                  </div>
                  
                  <div className="md:col-span-2 pt-6 mt-2 border-t border-gray-100 dark:border-slate-700">
                    <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-[2px] mb-4 flex items-center gap-2">
                       <div className="w-1.5 h-4 bg-[#EA6C00] rounded-full" />
                       Informasi Pembayaran
                    </h3>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Metode Pembayaran *</label>
                      <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all cursor-pointer">
                        <option value="CASH">CASH KERAS</option>
                        <option value="KPR">KPR</option>
                      </select>
                    </div>
                  </div>
 
                   {formData.paymentMethod === 'KPR' && (
                    <>
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Nama Bank</label>
                          <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Plafon (Rp)</label>
                          <input type="number" value={formData.kprAmount} onChange={e => setFormData({...formData, kprAmount: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Tenor (Bln)</label>
                          <input type="number" value={formData.kprTenor} onChange={e => setFormData({...formData, kprTenor: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Memproses...
                    </>
                  ) : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
