"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import UnitDetailModal from "./UnitDetailModal";

export default function UnitClient({ initialData, projects, customers }: { initialData: any[], projects: any[], customers: any[] }) {
  const [units, setUnits] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [projectFilter, setProjectFilter] = useState("SEMUA");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    blockName: "",
    unitNumber: "",
    type: "",
    landArea: "",
    buildingArea: "",
    price: "",
    projectId: "",
  });

  const [assignData, setAssignData] = useState({ customerId: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) setStatusDropdownOpen(false);
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) setProjectDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUnits = units.filter(u => {
    const matchesSearch = u.unitCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "SEMUA" || u.status === statusFilter;
    const matchesProject = projectFilter === "SEMUA" || u.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'TERSEDIA': return 'bg-emerald-100 text-emerald-700';
      case 'BOOKING': return 'bg-blue-100 text-blue-700';
      case 'INDENT': return 'bg-yellow-100 text-yellow-700';
      case 'AKAD': return 'bg-orange-100 text-orange-700';
      case 'LUNAS': return 'bg-purple-100 text-purple-700';
      case 'SERAH_TERIMA': return 'bg-slate-200 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          landArea: parseFloat(formData.landArea),
          buildingArea: parseFloat(formData.buildingArea),
          price: parseFloat(formData.price),
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowAddModal(false);
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/units/${showAssignModal}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignData)
      });
      const result = await response.json();
      if (result.success) {
        setShowAssignModal(null);
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
            Master Unit Kavling
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-3">
            Kelola persediaan unit perumahan dan kavling
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 ml-auto w-full md:w-auto justify-center md:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Unit
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
                placeholder="Cari kode unit atau tipe..."
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

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-700 w-full md:w-auto">
                <div className="relative" ref={projectRef}>
                  <button
                    type="button"
                    onClick={() => {
                        setProjectDropdownOpen(!projectDropdownOpen);
                        setStatusDropdownOpen(false);
                    }}
                    className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                  >
                    <span>{projectFilter === "SEMUA" ? "Semua Proyek" : projects.find(p => p.id === projectFilter)?.name || "Pilih Proyek"}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${projectDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {projectDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      <button onClick={() => { setProjectFilter("SEMUA"); setProjectDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${projectFilter === "SEMUA" ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>Semua Proyek</button>
                      {projects.map(p => (
                        <button key={p.id} onClick={() => { setProjectFilter(p.id); setProjectDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${projectFilter === p.id ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>{p.name}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={statusRef}>
                  <button
                    type="button"
                    onClick={() => {
                        setStatusDropdownOpen(!statusDropdownOpen);
                        setProjectDropdownOpen(false);
                    }}
                    className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors whitespace-nowrap"
                  >
                    <span>{statusFilter === "SEMUA" ? "Semua Status" : statusFilter}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {statusDropdownOpen && (
                    <div className="absolute z-50 right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5 animate-in fade-in zoom-in-95 duration-200">
                      {["SEMUA", "TERSEDIA", "BOOKING", "INDENT", "AKAD", "LUNAS", "SERAH_TERIMA"].map(s => (
                        <button key={s} onClick={() => { setStatusFilter(s); setStatusDropdownOpen(false); }} className={`flex items-center px-3 py-2 text-sm font-bold rounded-lg ${statusFilter === s ? "bg-orange-50 text-orange-600" : "text-gray-600 hover:bg-gray-50"}`}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[12px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#F9FAFB] dark:bg-slate-900 border-b border-[#E5E7EB] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kode Unit</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Blok</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pelanggan</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5-11.5L3 18.75V21h.75v-.75" />
                        </svg>
                        Tidak ada data unit ditemukan.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap">
                         <span className="font-bold text-[#EA6C00]">{u.unitCode}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        Blok {u.blockName} No. {u.unitNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{u.type}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-gray-100">
                        Rp {new Intl.NumberFormat('id-ID').format(u.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                            u.status === 'TERSEDIA' ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            u.status === 'BOOKING' ? 'bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400' :
                            u.status === 'INDENT' ? 'bg-yellow-50 text-yellow-700 ring-yellow-700/10 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            u.status === 'AKAD' ? 'bg-orange-50 text-orange-700 ring-orange-700/10 dark:bg-orange-900/30 dark:text-orange-400' :
                            u.status === 'LUNAS' ? 'bg-purple-50 text-purple-700 ring-purple-700/10 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-slate-100 text-slate-700 ring-slate-700/10 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.customer ? (
                          <div className="flex flex-col">
                             <span className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#EA6C00] transition-colors">{u.customer.name}</span>
                             <span className="text-[10px] text-gray-400 font-medium uppercase">{u.customer.customerCode}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300 dark:text-slate-600 font-black italic uppercase tracking-wider">Tersedia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {u.status === 'TERSEDIA' ? (
                          <button onClick={() => setShowAssignModal(u.id)} className="px-3 py-1.5 text-xs font-bold text-[#EA6C00] bg-[#EA6C00]/10 hover:bg-[#EA6C00] hover:text-white rounded-lg transition-all">Assign</button>
                        ) : (
                          <button 
                            onClick={() => setDetailId(u.id)}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all"
                          >
                            Detail
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Unit Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddUnit} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Proyek *</label>
                    <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all cursor-pointer">
                      <option value="">Pilih Proyek...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Blok *</label>
                    <input type="text" required placeholder="Contoh: A, B, Mawar" value={formData.blockName} onChange={e => setFormData({...formData, blockName: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Nomor Unit *</label>
                    <input type="text" required placeholder="Contoh: 01, 02a" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} className="w-full h-11 px-4 rounded-[10px) border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Tipe (LB/LT) *</label>
                    <input type="text" required placeholder="Contoh: 36/72" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Harga *</label>
                    <input type="number" required placeholder="350000000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Luas Bangunan (m2) *</label>
                    <input type="number" required value={formData.buildingArea} onChange={e => setFormData({...formData, buildingArea: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Luas Tanah (m2) *</label>
                    <input type="number" required value={formData.landArea} onChange={e => setFormData({...formData, landArea: e.target.value})} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-800/30">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
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
                  ) : 'Simpan Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Pelanggan ke Unit</h2>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Pilih Pelanggan *</label>
                <select required value={assignData.customerId} onChange={e => setAssignData({ customerId: e.target.value })} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all cursor-pointer">
                  <option value="">Pilih pelanggan...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customerCode} - {c.name} ({c.paymentMethod})</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(null)} className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-[10px] transition-all">Batal</button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white text-sm font-bold rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Memproses...
                    </>
                  ) : 'Assign Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailId && <UnitDetailModal unitId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
