"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import * as xlsx from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function formatRupiah(num: number) {
  return "Rp " + Math.abs(num).toLocaleString("id-ID");
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

  const isNeracaBalanced = neracaData.totalAset === (neracaData.totalKewajiban + neracaData.totalEkuitas);

  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] text-gray-600 dark:text-gray-300 p-6 md:p-8 min-h-screen printable-area">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Laporan Keuangan</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Laporan Laba Rugi, Neraca & Arus Kas</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handleExportExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            Export Excel
          </button>
          <button onClick={handleExportPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            Export PDF
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            Cetak
          </button>
        </div>
      </div>

      <form onSubmit={handleFilterChange} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 mb-6 shadow-sm no-print">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="w-full md:w-56">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Dari Tanggal</label>
            <input type="date" name="from" defaultValue={fromDate} className="w-full px-4 py-2 border rounded-lg text-sm dark:bg-slate-900 border-gray-200 dark:border-slate-700" />
          </div>
          <div className="w-full md:w-56">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Sampai Tanggal</label>
            <input type="date" name="to" defaultValue={toDate} className="w-full px-4 py-2 border rounded-lg text-sm dark:bg-slate-900 border-gray-200 dark:border-slate-700" />
          </div>
          <div className="flex-1 md:max-w-xs">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Proyek</label>
            <select name="project" defaultValue={projectFilter} className="w-full px-4 py-2 border rounded-lg text-sm dark:bg-slate-900 border-gray-200 dark:border-slate-700">
              <option value="">Semua Proyek</option>
              {projects.map((p: any) => (<option key={p.id} value={p.id}>{p.code} — {p.name}</option>))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg">Filter</button>
          </div>
        </div>
      </form>

      <div className="flex items-center gap-2 mb-6 no-print">
        {['laba_rugi', 'neraca', 'arus_kas'].map((tab) => (
          <Link key={tab} href={`?tab=${tab}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
            className={`px-5 py-2.5 font-semibold text-sm rounded-lg border flex items-center gap-2 ${
              activeTab === tab ? "bg-white text-slate-800 border-gray-200 shadow-sm dark:bg-slate-800 dark:text-white" : "border-transparent text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800"
            }`}>
            {tab.replace('_', ' ').toUpperCase()}
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
              {!isNeracaBalanced && <div className="text-right text-xs font-bold text-red-500 uppercase">Warning: Neraca Tidak Balance! Selisih: {formatRupiah(Math.abs(neracaData.totalAset - (neracaData.totalKewajiban + neracaData.totalEkuitas)))}</div>}
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
