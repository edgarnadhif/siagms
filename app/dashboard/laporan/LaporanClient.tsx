"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

export default function LaporanClient({
  activeTab, fromDate, toDate, projectFilter, projects, companyName,
  labaRugiData, neracaData, arusKasData
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());
    const from = fd.get("from") as string;
    const to = fd.get("to") as string;
    const proj = fd.get("project") as string;
    if (from) params.set("from", from); else params.delete("from");
    if (to) params.set("to", to); else params.delete("to");
    if (proj) params.set("project", proj); else params.delete("project");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const periodLabel = fromDate && toDate ? `${fromDate} s/d ${toDate}` : "Semua Periode";

  // Export PDF
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Excel
  const handleExportExcel = () => {
    const wb = xlsx.utils.book_new();
    if (activeTab === "laba_rugi") {
      const data = [
        { Deskripsi: "PENDAPATAN PENJUALAN UNIT", Jumlah: labaRugiData.pendapatanPenjualan },
        { Deskripsi: "PENDAPATAN LAIN-LAIN", Jumlah: labaRugiData.pendapatanLainLain },
        { Deskripsi: "TOTAL PENDAPATAN", Jumlah: labaRugiData.totalPendapatanLR },
        { Deskripsi: "HARGA POKOK PENJUALAN", Jumlah: labaRugiData.hpp },
        { Deskripsi: "LABA KOTOR", Jumlah: labaRugiData.labaKotor },
        { Deskripsi: "BEBAN KONSTRUKSI", Jumlah: labaRugiData.bebanKonstruksi },
        { Deskripsi: "BEBAN MARKETING", Jumlah: labaRugiData.bebanMarketing },
        { Deskripsi: "BEBAN GAJI", Jumlah: labaRugiData.bebanGaji },
        { Deskripsi: "BEBAN OPERASIONAL", Jumlah: labaRugiData.bebanOperasional },
        { Deskripsi: "BEBAN LAIN-LAIN", Jumlah: labaRugiData.bebanLainLain },
        { Deskripsi: "TOTAL BEBAN OPERASIONAL", Jumlah: labaRugiData.totalBebanOperasional },
        { Deskripsi: "LABA BERSIH", Jumlah: labaRugiData.labaBersih },
      ];
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), "Laba Rugi");
    } else if (activeTab === "neraca") {
      const data = [
        { Kategori: "ASET", Item: "Kas", Jumlah: neracaData.kas },
        { Kategori: "ASET", Item: "Bank", Jumlah: neracaData.bank },
        { Kategori: "ASET", Item: "Piutang Pembeli", Jumlah: neracaData.piutangPembeli },
        { Kategori: "ASET", Item: "Piutang KPR", Jumlah: neracaData.piutangKPR },
        { Kategori: "ASET", Item: "Persediaan Unit Siap Jual", Jumlah: neracaData.persediaanUnit },
        { Kategori: "ASET", Item: "BDK", Jumlah: neracaData.bdk },
        { Kategori: "ASET", Item: "Tanah", Jumlah: neracaData.tanah },
        { Kategori: "ASET", Item: "TOTAL ASET", Jumlah: neracaData.totalAset },
        { Kategori: "KEWAJIBAN", Item: "Pendapatan Diterima Dmuka", Jumlah: neracaData.pendDiterimaDiMuka },
        { Kategori: "KEWAJIBAN", Item: "Hutang Kontraktor", Jumlah: neracaData.hutangKontraktor },
        { Kategori: "KEWAJIBAN", Item: "Hutang Usaha", Jumlah: neracaData.hutangUsaha },
        { Kategori: "KEWAJIBAN", Item: "Hutang Bank", Jumlah: neracaData.hutangBank },
        { Kategori: "KEWAJIBAN", Item: "TOTAL KEWAJIBAN", Jumlah: neracaData.totalKewajiban },
        { Kategori: "EKUITAS", Item: "Modal Disetor", Jumlah: neracaData.modalDisetor },
        { Kategori: "EKUITAS", Item: "Laba Ditahan", Jumlah: neracaData.labaDitahan },
        { Kategori: "EKUITAS", Item: "Laba Periode Berjalan", Jumlah: neracaData.labaBersih },
        { Kategori: "EKUITAS", Item: "TOTAL EKUITAS", Jumlah: neracaData.totalEkuitas },
      ];
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), "Neraca");
    } else if (activeTab === "arus_kas") {
      const data = [
        { Kategori: "OPERASI (MASUK)", Item: "Cair KPR", Jumlah: arusKasData.operasiMasuk.pencairanKPR },
        { Kategori: "OPERASI (MASUK)", Item: "Pelunasan Cash", Jumlah: arusKasData.operasiMasuk.pelunasanCash },
        { Kategori: "OPERASI (MASUK)", Item: "Booking Fee", Jumlah: arusKasData.operasiMasuk.bookingFee },
        { Kategori: "OPERASI (MASUK)", Item: "Down Payment", Jumlah: arusKasData.operasiMasuk.downPayment },
        { Kategori: "OPERASI (KELUAR)", Item: "Konstruksi", Jumlah: arusKasData.operasiKeluar.konstruksi },
        { Kategori: "OPERASI (KELUAR)", Item: "Marketing", Jumlah: arusKasData.operasiKeluar.marketing },
        { Kategori: "OPERASI (KELUAR)", Item: "Gaji", Jumlah: arusKasData.operasiKeluar.gaji },
        { Kategori: "OPERASI (KELUAR)", Item: "Operasional", Jumlah: arusKasData.operasiKeluar.operasional },
        { Kategori: "OPERASI (KELUAR)", Item: "Lain-lain", Jumlah: arusKasData.operasiKeluar.lain },
        { Kategori: "TOTAL", Item: "KAS BERSIH AKTIVITAS OPERASI", Jumlah: arusKasData.kasBersihOperasi },
        { Kategori: "TOTAL", Item: "KAS BERSIH AKTIVITAS INVESTASI", Jumlah: arusKasData.kasBersihInvestasi },
        { Kategori: "TOTAL", Item: "KAS BERSIH AKTIVITAS PENDANAAN", Jumlah: arusKasData.kasBersihPendanaan },
        { Kategori: "SALDO", Item: "KENAIKAN KAS BERSIH", Jumlah: arusKasData.kasBersihOperasi },
        { Kategori: "SALDO", Item: "SALDO AWAL", Jumlah: arusKasData.saldoAwal },
        { Kategori: "SALDO", Item: "SALDO AKHIR", Jumlah: arusKasData.saldoAkhir },
      ];
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), "Arus Kas");
    }
    xlsx.writeFile(wb, `Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const kewajibanEkuitas = neracaData.totalKewajiban + neracaData.totalEkuitas;
  const selisihNeraca = Math.abs(neracaData.totalAset - kewajibanEkuitas);
  const isNeracaBalanced = selisihNeraca <= 1000;


  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full printable-area">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Laporan Keuangan</h1>
          <p className="text-sm text-gray-400 mt-3">Laporan Laba Rugi, Neraca & Arus Kas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print w-full md:w-auto">
          <button onClick={handleExportExcel} className="flex-1 md:flex-none px-4 h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all active:scale-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125h18.75c.621 0 1.125.504 1.125 1.125v1.5m-19.875 0a1.125 1.125 0 001.125 1.125m17.25 0a1.125 1.125 0 001.125-1.125m0 0V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125h-7.5c-.621 0-1.125-.504-1.125-1.125m-8.625-1.125h18.75M12 15.75h.008v.008H12v-.008z" /></svg>
            Excel
          </button>
          <button onClick={handleExportPDF} className="flex-1 md:flex-none px-4 h-11 bg-red-600 hover:bg-red-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-red-500/10 transition-all active:scale-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            PDF
          </button>
          <button onClick={() => window.print()} className="flex-1 md:flex-none px-4 h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-[10px] text-sm font-bold shadow-lg shadow-black/10 transition-all active:scale-95 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.844l-.452 2.258A1.745 1.745 0 007.973 18.12h8.054a1.745 1.745 0 001.705-2.018l-.452-2.258m-10.287 0a2.392 2.392 0 010-3.142l.333-.333a2.391 2.391 0 013.141 0l.334.333a2.391 2.391 0 003.142 0l.333-.333a2.391 2.391 0 013.142 0l.333.333a2.391 2.391 0 010 3.142m-10.287 0l8.054-.001" /></svg>
            Print
          </button>
        </div>
      </div>

      <form onSubmit={handleFilterChange} className="bg-white dark:bg-slate-800 rounded-[12px] border border-[#E5E7EB] dark:border-slate-700 p-5 mb-6 shadow-sm no-print px-4">
        <div className="flex flex-col md:flex-row gap-5 items-end">
          <div className="w-full md:w-48">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Dari Tanggal</label>
            <input type="date" name="from" defaultValue={fromDate} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Sampai Tanggal</label>
            <input type="date" name="to" defaultValue={toDate} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all" />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">Pilih Proyek</label>
            <select name="project" defaultValue={projectFilter} className="w-full h-11 px-4 rounded-[10px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-[#EA6C00]/10 focus:border-[#EA6C00] outline-none transition-all cursor-pointer">
              <option value="">Semua Proyek</option>
              {projects.map((p: any) => (<option key={p.id} value={p.id}>{p.code} — {p.name}</option>))}
            </select>
          </div>
          <button type="submit" className="h-11 px-8 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-[10px] transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-black/10">
            Terapkan Filter
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-1.5 mb-8 no-print px-4 md:px-0">
        {['laba_rugi', 'neraca', 'arus_kas'].map((tab) => (
          <Link key={tab} href={`?tab=${tab}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
            className={`px-6 h-11 flex items-center justify-center text-xs font-black uppercase tracking-widest rounded-full transition-all ${
              activeTab === tab 
                ? "bg-[#EA6C00] text-white shadow-lg shadow-orange-500/20" 
                : "bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
            }`}>
            {tab.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <div ref={reportRef} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden p-8" style={{ minHeight: "800px" }}>
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{companyName}</h2>
          <h3 className="text-lg font-bold text-[#EA6C00] uppercase mt-1">
            {activeTab === 'laba_rugi' && "LAPORAN LABA RUGI"}
            {activeTab === 'neraca' && "NERACA KEUANGAN"}
            {activeTab === 'arus_kas' && "LAPORAN ARUS KAS"}
          </h3>
          <p className="text-sm font-medium text-slate-500 mt-2">Periode: {periodLabel}</p>
        </div>

        {/* LABA RUGI */}
        {activeTab === "laba_rugi" && (
          <div className="max-w-4xl mx-auto text-sm space-y-4">
            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">PENDAPATAN</div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Pendapatan Penjualan Unit</span>
              <span>{formatRupiah(labaRugiData.pendapatanPenjualan)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Pendapatan Lain-lain</span>
              <span>{formatRupiah(labaRugiData.pendapatanLainLain)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4">
              <span>TOTAL PENDAPATAN</span>
              <span>{formatRupiah(labaRugiData.totalPendapatanLR)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 dark:text-white pb-4">
              <span>HARGA POKOK PENJUALAN</span>
              <span>({formatRupiah(labaRugiData.hpp)})</span>
            </div>

            <div className="flex justify-between font-black text-[#EA6C00] text-base border-b-2 border-slate-900 dark:border-slate-200 pb-2">
              <span>LABA KOTOR</span>
              <span>{formatRupiah(labaRugiData.labaKotor)}</span>
            </div>

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">BEBAN OPERASIONAL</div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Beban Konstruksi</span>
              <span>{formatRupiah(labaRugiData.bebanKonstruksi)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Beban Marketing</span>
              <span>{formatRupiah(labaRugiData.bebanMarketing)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Beban Gaji</span>
              <span>{formatRupiah(labaRugiData.bebanGaji)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Beban Operasional Kantor</span>
              <span>{formatRupiah(labaRugiData.bebanOperasional)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Beban Lain-lain</span>
              <span>{formatRupiah(labaRugiData.bebanLainLain)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4">
              <span>TOTAL BEBAN OPERASIONAL</span>
              <span>({formatRupiah(labaRugiData.totalBebanOperasional)})</span>
            </div>

            <div className={`flex justify-between font-black text-lg border-y-2 border-slate-900 dark:border-slate-200 py-3 mt-4 ${labaRugiData.labaBersih >= 0 ? 'text-[#16a34a]' : 'text-red-600'}`}>
              <span>LABA (RUGI) BERSIH</span>
              <span>{formatRupiah(labaRugiData.labaBersih)}</span>
            </div>
          </div>
        )}

        {/* NERACA */}
        {activeTab === "neraca" && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 text-sm">
            {/* LSS Aset */}
            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">ASET</div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1100 - Kas</span><span>{formatRupiah(neracaData.kas)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1200 - Bank</span><span>{formatRupiah(neracaData.bank)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1300 - Piutang Pembeli</span><span>{formatRupiah(neracaData.piutangPembeli)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1400 - Piutang KPR</span><span>{formatRupiah(neracaData.piutangKPR)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1500 - Persediaan Unit (Siap Jual)</span><span>{formatRupiah(neracaData.persediaanUnit)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1600 - BDK</span><span>{formatRupiah(neracaData.bdk)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>1700 - Tanah</span><span>{formatRupiah(neracaData.tanah)}</span></div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL ASET</span><span>{formatRupiah(neracaData.totalAset)}</span>
              </div>
            </div>

            {/* RSS Kewa & Eku */}
            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">KEWAJIBAN</div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>2100 - Pendapatan Diterima di Muka</span><span>{formatRupiah(neracaData.pendDiterimaDiMuka)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>2200 - Hutang Kontraktor</span><span>{formatRupiah(neracaData.hutangKontraktor)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>2300 - Hutang Usaha</span><span>{formatRupiah(neracaData.hutangUsaha)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>2400 - Hutang Bank</span><span>{formatRupiah(neracaData.hutangBank)}</span></div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL KEWAJIBAN</span><span>{formatRupiah(neracaData.totalKewajiban)}</span>
              </div>

              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg pt-4">EKUITAS</div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>3100 - Modal Disetor</span><span>{formatRupiah(neracaData.modalDisetor)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>3200 - Laba Ditahan</span><span>{formatRupiah(neracaData.labaDitahan)}</span></div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300"><span>Laba Periode Berjalan</span><span>{formatRupiah(neracaData.labaBersih)}</span></div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL EKUITAS</span><span>{formatRupiah(neracaData.totalEkuitas)}</span>
              </div>

              <div className={`flex justify-between font-black text-lg border-y-2 border-slate-800 py-3 ${isNeracaBalanced ? "text-[#16a34a]" : "text-red-500"}`}>
                 <span>TOTAL KEWAJIBAN & EKUITAS</span>
                 <span>{formatRupiah(neracaData.totalKewajiban + neracaData.totalEkuitas)}</span>
              </div>
              {!isNeracaBalanced && <div className="text-right text-xs font-bold text-red-500 uppercase mt-1">⚠ Neraca Tidak Balance! Selisih: {formatRupiah(selisihNeraca)}</div>}

            </div>
          </div>
        )}

        {/* ARUS KAS */}
        {activeTab === "arus_kas" && (
          <div className="max-w-4xl mx-auto text-sm space-y-4">
            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">AKTIVITAS OPERASI</div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-2">Penerimaan kas dari pembeli:</div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Booking Fee</span><span>{formatRupiah(arusKasData.operasiMasuk.bookingFee)}</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Down Payment</span><span>{formatRupiah(arusKasData.operasiMasuk.downPayment)}</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Pencairan KPR</span><span>{formatRupiah(arusKasData.operasiMasuk.pencairanKPR)}</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Pelunasan Cash</span><span>{formatRupiah(arusKasData.operasiMasuk.pelunasanCash)}</span></div>

            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-4">Pengeluaran kas untuk operasi:</div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Biaya Konstruksi</span><span>({formatRupiah(arusKasData.operasiKeluar.konstruksi)})</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Biaya Marketing</span><span>({formatRupiah(arusKasData.operasiKeluar.marketing)})</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Biaya Gaji</span><span>({formatRupiah(arusKasData.operasiKeluar.gaji)})</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Biaya Operasional</span><span>({formatRupiah(arusKasData.operasiKeluar.operasional)})</span></div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300"><span>Biaya Lain-lain</span><span>({formatRupiah(arusKasData.operasiKeluar.lain)})</span></div>

            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS OPERASI</span>
              <span>{formatRupiah(arusKasData.kasBersihOperasi)}</span>
            </div>

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">AKTIVITAS INVESTASI</div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS INVESTASI</span>
              <span>Rp 0</span>
            </div>

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">AKTIVITAS PENDANAAN</div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS PENDANAAN</span>
              <span>Rp 0</span>
            </div>

            <div className="flex justify-between font-black text-base border-y-2 border-slate-900 dark:border-slate-200 py-3 mt-8">
              <span>KENAIKAN/PENURUNAN KAS BERSIH</span>
              <span className={arusKasData.kasBersihOperasi >= 0 ? 'text-[#16a34a]' : 'text-red-500'}>{formatRupiah(arusKasData.kasBersihOperasi)}</span>
            </div>
            <div className="flex justify-between font-semibold text-sm pt-2 text-slate-600">
              <span>SALDO KAS AWAL PERIODE</span>
              <span>{formatRupiah(arusKasData.saldoAwal)}</span>
            </div>
            <div className="flex justify-between font-black text-lg border-t-2 border-slate-900 dark:border-slate-200 pt-3 mt-2 text-[#EA6C00]">
              <span>SALDO KAS AKHIR PERIODE</span>
              <span>{formatRupiah(arusKasData.saldoAkhir)}</span>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; background: white; padding: 0;}
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
