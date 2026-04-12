"use client";

import React, { useEffect, useState, useRef } from "react";
import { useActionState } from "react";
import { createTransaction } from "@/app/actions";
import { useRouter, useSearchParams } from "next/navigation";

interface Project {
  id: string;
  code: string;
  name: string;
}

interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string;
  paymentMethod?: string;
}

interface UnitOption {
  id: string;
  unitCode: string;
  blockName: string;
  unitNumber: string;
  status: string;
  projectId: string;
  customer?: CustomerOption | null;
}

const CATEGORIES = [
  { id: "BOOKING_FEE", label: "Booking Fee" },
  { id: "DOWN_PAYMENT", label: "Down Payment" },
  { id: "ANGSURAN_KPR", label: "Angsuran KPR", method: "KPR" },
  { id: "PELUNASAN_CASH", label: "Pelunasan Cash", method: "CASH" },
  { id: "PENCAIRAN_KPR", label: "Pencairan KPR" },
  { id: "BIAYA_KONSTRUKSI", label: "Biaya Konstruksi" },
  { id: "BIAYA_MARKETING", label: "Biaya Marketing" },
  { id: "BIAYA_OPERASIONAL", label: "Biaya Operasional" },
  { id: "BIAYA_GAJI", label: "Biaya Gaji" },
  { id: "LAIN_LAIN", label: "Lain-lain" },
];

export default function AddTransaksiModal({ 
  projects, 
  units, 
  customers 
}: { 
  projects: Project[], 
  units: UnitOption[], 
  customers: CustomerOption[] 
}) {
  const [state, formAction, isPending] = useActionState(createTransaction, null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialUnit = units.find((item) => item.id === searchParams.get("unitId")) || null;
  const initialCustomer = (initialUnit?.customer as CustomerOption | null) || customers.find((item) => item.id === searchParams.get("customerId")) || null;
  const initialProjectId = initialUnit?.projectId || searchParams.get("projectId") || "";

  // Dropdown States
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(initialCategory && CATEGORIES.some((item) => item.id === initialCategory) ? initialCategory : "");
  const catRef = useRef<HTMLDivElement>(null);

  const [projOpen, setProjOpen] = useState(false);
  const [selectedProj, setSelectedProj] = useState(initialProjectId && projects.some((project) => project.id === initialProjectId) ? initialProjectId : "");
  const projRef = useRef<HTMLDivElement>(null);

  const [unitOpen, setUnitOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit?.id || "");
  const unitRef = useRef<HTMLDivElement>(null);

  const [custOpen, setCustOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer?.id || "");
  const custRef = useRef<HTMLDivElement>(null);
  
  const [customerInfo, setCustomerInfo] = useState<{ id: string, name: string, method?: string } | null>(
    initialCustomer
      ? { id: initialCustomer.id, name: initialCustomer.name, method: initialCustomer.paymentMethod }
      : null
  );
  const isExpenseCategory = ["BIAYA_KONSTRUKSI", "BIAYA_MARKETING", "BIAYA_OPERASIONAL", "BIAYA_GAJI", "LAIN_LAIN"].includes(selectedCat);
  const isIncomeCategory = ["BOOKING_FEE", "DOWN_PAYMENT", "PENCAIRAN_KPR", "PELUNASAN_CASH"].includes(selectedCat);

  useEffect(() => {
    if (state?.success) {
      router.push("/dashboard/transaksi");
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(event.target as Node)) setCatOpen(false);
      if (projRef.current && !projRef.current.contains(event.target as Node)) setProjOpen(false);
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) setUnitOpen(false);
      if (custRef.current && !custRef.current.contains(event.target as Node)) setCustOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    router.push("/dashboard/transaksi");
  };

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnit(unitId);
    setUnitOpen(false);
    const u = units?.find(x => x.id === unitId);
    if (u) {
      setSelectedProj(u.projectId || "");
    }
    if (u && u.customer) {
      setSelectedCustomer(u.customer.id);
      setCustomerInfo({
        id: u.customer.id,
        name: u.customer.name,
        method: u.customer.paymentMethod
      });
      // Filter cat if current selected doesn't match new method
      if (selectedCat && CATEGORIES.find(c => c.id === selectedCat)?.method && CATEGORIES.find(c => c.id === selectedCat)?.method !== u.customer.paymentMethod) {
        setSelectedCat("");
      }
    } else {
      setSelectedCustomer("");
      setCustomerInfo(null);
      if (!u) {
        setSelectedProj("");
      }
    }
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomer(custId);
    setCustOpen(false);
    const c = customers?.find(x => x.id === custId);
    if (c) {
      setCustomerInfo({
        id: c.id,
        name: c.name,
        method: c.paymentMethod
      });
      if (selectedCat && CATEGORIES.find(c => c.id === selectedCat)?.method && CATEGORIES.find(c => c.id === selectedCat)?.method !== c.paymentMethod) {
        setSelectedCat("");
      }
    } else {
      setCustomerInfo(null);
    }
  };

  // Filter categories based on customer's payment method
  const filteredCategories = CATEGORIES.filter(cat => {
    if (!cat.method) return true;
    if (!customerInfo?.method) return true; // Allow selecting if no customer selected? instruction says "hanya muncul jika metode..."
    return cat.method === customerInfo.method;
  });

  const currentCatLabel = CATEGORIES.find(c => c.id === selectedCat)?.label || "Pilih kategori";
  const currentProjLabel = projects.find(p => p.id === selectedProj) 
    ? `${projects.find(p => p.id === selectedProj)?.code} — ${projects.find(p => p.id === selectedProj)?.name}` 
    : "Tanpa proyek";
  
  const unitObj = units?.find(u => u.id === selectedUnit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[#F3F4F6] dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tambah Transaksi</h2>
          <button 
            onClick={handleClose} 
            className="p-2 text-gray-400 hover:text-[#EA6C00] dark:hover:text-[#EA6C00] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="overflow-y-auto">
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  No. Referensi <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="text"
                  name="reference"
                  required
                  pattern="[a-zA-Z0-9\-/]{3,}"
                  title="Minimal 3 karakter, Alphanumeric"
                  placeholder="TRX-001"
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Tanggal <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Keterangan <span className="text-[#EA6C00]">*</span>
              </label>
              <input
                type="text"
                name="description"
                required
                minLength={5}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  const isTest = ["test", "asd", "xxx", "tedasd"].some(skip => val.includes(skip));
                  const warnBox = document.getElementById("test-warning");
                  if (warnBox) warnBox.style.display = isTest ? "block" : "none";
                }}
                placeholder="Deskripsi transaksi"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
              <p id="test-warning" className="hidden mt-1 text-[10px] font-bold text-orange-500 uppercase">
                Perhatian: hindari menggunakan kata &quot;test/asd&quot; untuk data asli.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Catatan
              </label>
              <input
                type="text"
                name="note"
                placeholder="Catatan tambahan (opsional)"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={catRef}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Kategori <span className="text-[#EA6C00]">*</span>
                </label>
                <input type="hidden" name="category" value={selectedCat} required />
                <button
                  type="button"
                  onClick={() => setCatOpen(!catOpen)}
                  className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                    catOpen 
                      ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                      : "border-[#E5E7EB] dark:border-slate-600"
                  } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
                >
                  <span className={selectedCat ? "" : "text-gray-400"}>{currentCatLabel}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {catOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                    {filteredCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setSelectedCat(cat.id); setCatOpen(false); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          selectedCat === cat.id 
                            ? "bg-[#EA6C00] text-white" 
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Jumlah (Rp) <span className="text-[#EA6C00]">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  placeholder="0"
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all placeholder-gray-400"
                />
              </div>
            </div>

            <div className="relative" ref={projRef}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Proyek {isExpenseCategory && <span className="text-red-500">*</span>}
              </label>
              <input type="hidden" name="projectId" value={selectedProj} />
              <button
                type="button"
                onClick={() => setProjOpen(!projOpen)}
                className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                  projOpen 
                    ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                    : "border-[#E5E7EB] dark:border-slate-600"
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none`}
              >
                <span className={selectedProj ? "" : "text-gray-400"}>{selectedProj ? currentProjLabel : "Tanpa proyek"}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${projOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                {isExpenseCategory ? "Pilih proyek tujuan pengeluaran" : isIncomeCategory ? "Terisi otomatis dari unit yang dipilih" : "Opsional untuk kategori ini"}
              </p>
              {projOpen && (
                <div className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl py-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedProj(""); setProjOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      selectedProj === "" 
                        ? "bg-[#EA6C00] text-white" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    Tanpa proyek
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProj(p.id); setProjOpen(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedProj === p.id 
                          ? "bg-[#EA6C00] text-white" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      {p.code} — {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={unitRef}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Unit {isIncomeCategory && <span className="text-red-500">*</span>}
              </label>
              <input type="hidden" name="unitId" value={selectedUnit} />
              <button
                type="button"
                onClick={() => setUnitOpen(!unitOpen)}
                className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                  unitOpen 
                    ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                    : "border-[#E5E7EB] dark:border-slate-600"
                } bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none shadow-sm focus:shadow-md transition-all`}
              >
                <div className="flex flex-col">
                  <span className={selectedUnit ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}>
                    {selectedUnit ? unitObj?.unitCode : "Pilih Unit"}
                  </span>
                  {selectedUnit && (
                    <span className="text-[11px] text-gray-500 font-normal">
                      Blok {unitObj?.blockName} No.{unitObj?.unitNumber} — {unitObj?.customer?.name || "Tanpa Pelanggan"}
                    </span>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${unitOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                {isIncomeCategory ? "Pilih unit terkait pembayaran" : "Opsional untuk kategori ini"}
              </p>
              {unitOpen && (
                <div className="absolute z-[60] left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl py-2">
                  <button
                    type="button"
                    onClick={() => handleSelectUnit("")}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 mb-1`}
                  >
                    Batal Pilih Unit
                  </button>
                  <div className="px-4 py-1 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-700/30">Daftar Unit Terjual/Booking</div>
                  {units?.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUnit(u.id)}
                      className={`block w-full text-left px-4 py-2.5 transition-colors border-l-4 ${
                        selectedUnit === u.id 
                          ? "bg-[#FFF0E6] dark:bg-orange-950/30 border-[#EA6C00]" 
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${selectedUnit === u.id ? "text-[#EA6C00]" : "text-gray-700 dark:text-gray-200"}`}>
                          {u.unitCode} - Blok {u.blockName} No.{u.unitNumber}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {u.customer?.name || "Tanpa Pelanggan"} • {u.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={custRef}>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Pelanggan {isIncomeCategory && <span className="text-red-500">*</span>}
              </label>
              <input type="hidden" name="customerId" value={selectedCustomer} required={isIncomeCategory} />
              <button
                type="button"
                onClick={() => setCustOpen(!custOpen)}
                disabled={!!selectedUnit && !!customerInfo}
                className={`flex justify-between items-center w-full px-4 py-2.5 border rounded-[10px] text-sm transition-all text-left ${
                  custOpen 
                    ? "border-[#EA6C00] ring-4 ring-[#EA6C00]/10" 
                    : "border-[#E5E7EB] dark:border-slate-600"
                } ${!!selectedUnit && !!customerInfo ? "bg-gray-50 dark:bg-slate-700/50 cursor-not-allowed opacity-80" : "bg-white dark:bg-slate-700"} text-gray-900 dark:text-white focus:outline-none shadow-sm`}
              >
                <div className="flex flex-col">
                  <span className={selectedCustomer ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}>
                    {selectedCustomer ? customerInfo?.name : "Pilih Pelanggan"}
                  </span>
                  {selectedCustomer && (
                    <span className="text-[11px] text-gray-500 font-normal">
                      Metode: {customerInfo?.method}
                    </span>
                  )}
                </div>
                {!selectedUnit && (
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${custOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                {isIncomeCategory ? "Pelanggan akan terisi dari unit, atau pilih manual bila perlu" : "Opsional untuk kategori ini"}
              </p>
              {custOpen && !selectedUnit && (
                <div className="absolute z-[60] left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-[10px] shadow-xl py-2">
                   <div className="px-4 py-1 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-700/30">Daftar Semua Pelanggan</div>
                  {customers?.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`block w-full text-left px-4 py-2 transition-colors border-l-4 ${
                        selectedCustomer === c.id 
                          ? "bg-[#FFF0E6] dark:bg-orange-950/30 border-[#EA6C00]" 
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                       <div className="flex flex-col">
                        <span className={`text-sm font-bold ${selectedCustomer === c.id ? "text-[#EA6C00]" : "text-gray-700 dark:text-gray-200"}`}>
                          {c.name}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {c.customerCode} • {c.paymentMethod}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {state?.error && (
              <div className="text-red-600 text-xs font-bold p-3 bg-red-50 dark:bg-red-900/20 rounded-[8px] border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {state.error}
                </div>
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
              ) : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
