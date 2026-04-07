"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import UnitDetailModal from "./UnitDetailModal";

export default function UnitClient({ initialData, projects, customers }: { initialData: any[], projects: any[], customers: any[] }) {
  const [units, setUnits] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [projectFilter, setProjectFilter] = useState("SEMUA");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  
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

  const filteredUnits = units.filter(u => {
    const matchesStatus = statusFilter === "SEMUA" || u.status === statusFilter;
    const matchesProject = projectFilter === "SEMUA" || u.projectId === projectFilter;
    return matchesStatus && matchesProject;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Master Unit Kavling</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola persediaan unit perumahan</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <span>+ Tambah Unit</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="SEMUA">Semua Proyek</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="TERSEDIA">TERSEDIA</option>
            <option value="BOOKING">BOOKING</option>
            <option value="INDENT">INDENT</option>
            <option value="AKAD">AKAD</option>
            <option value="LUNAS">LUNAS</option>
            <option value="SERAH_TERIMA">SERAH_TERIMA</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Kode Unit</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Blok</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Harga</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Tidak ada data unit ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{u.unitCode}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">Blok {u.blockName} No. {u.unitNumber}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{u.type}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                      Rp {new Intl.NumberFormat('id-ID').format(u.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 select-none rounded text-xs font-bold tracking-wider ${getStatusBadge(u.status)}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.customer ? (
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{u.customer.name}</div>
                      ) : (
                        <span className="text-slate-400 italic">Kosong</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.status === 'TERSEDIA' ? (
                        <button onClick={() => setShowAssignModal(u.id)} className="text-orange-500 hover:text-orange-600 font-bold transition-all hover:scale-105 active:scale-95 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-900/30">Assign</button>
                      ) : (
                        <button 
                          onClick={() => setDetailId(u.id)}
                          className="text-slate-600 dark:text-slate-300 hover:text-orange-500 font-bold transition-all hover:scale-105 active:scale-95 px-3 py-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600"
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Unit Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddUnit} className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proyek *</label>
                  <select required value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-orange-500 outline-none">
                    <option value="">Pilih Proyek...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Blok *</label>
                  <input type="text" required placeholder="Contoh: A, B, Mawar" value={formData.blockName} onChange={e => setFormData({...formData, blockName: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomor Unit *</label>
                  <input type="text" required placeholder="Contoh: 01, 02a" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe (LB/LT) *</label>
                  <input type="text" required placeholder="Contoh: 36/72" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga *</label>
                  <input type="number" required placeholder="Contoh: 350000000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Luas Bangunan (m2) *</label>
                  <input type="number" required value={formData.buildingArea} onChange={e => setFormData({...formData, buildingArea: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Luas Tanah (m2) *</label>
                  <input type="number" required value={formData.landArea} onChange={e => setFormData({...formData, landArea: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none focus:ring-orange-500" />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-medium text-slate-600 bg-white border border-gray-300 rounded-lg">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 font-medium text-white bg-orange-500 rounded-lg">{loading ? 'Memproses...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 text-slate-800 dark:text-white dark:bg-slate-800">
              <h2 className="text-xl font-bold">Assign Pelanggan ke Unit</h2>
              <button onClick={() => setShowAssignModal(null)} className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4 dark:bg-slate-800">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-200">Pilih Pelanggan *</label>
                <select required value={assignData.customerId} onChange={e => setAssignData({ customerId: e.target.value })} className="w-full px-3 py-2 rounded-lg border outline-none dark:bg-slate-700 dark:text-white dark:border-slate-600">
                  <option value="">Pilih pelanggan...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.customerCode} - {c.name} ({c.paymentMethod})</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(null)} className="px-4 py-2 font-medium text-gray-600 bg-white border rounded-lg dark:bg-slate-700 dark:text-white dark:border-slate-600">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 font-medium text-white bg-orange-500 rounded-lg">{loading ? 'Memproses...' : 'Assign Unit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailId && <UnitDetailModal unitId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
