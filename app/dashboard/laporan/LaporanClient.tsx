"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

type ProjectOption = {
  id: string;
  code: string;
  name: string;
};

type LabaRugiData = {
  pendapatanPenjualan: number;
  pendapatanLainLain: number;
  totalPendapatanLR: number;
  hppUmum: number;
  bebanKonstruksi: number;
  hpp: number;
  labaKotor: number;
  bebanMarketing: number;
  bebanGaji: number;
  bebanOperasional: number;
  bebanLainLain: number;
  totalBebanOperasional: number;
  labaBersih: number;
};

type NeracaData = {
  kas: number;
  bank: number;
  piutangPembeli: number;
  piutangKPR: number;
  persediaanUnit: number;
  bdk: number;
  tanah: number;
  totalAset: number;
  pendDiterimaDiMuka: number;
  hutangKontraktor: number;
  hutangUsaha: number;
  hutangBank: number;
  totalKewajiban: number;
  modalDisetor: number;
  labaDitahan: number;
  labaBersih: number;
  totalEkuitas: number;
};

type ArusKasData = {
  operasiMasuk: {
    bookingFee: number;
    downPayment: number;
    pencairanKPR: number;
    pelunasanCash: number;
    penerimaanLainnya: number;
  };
  operasiKeluar: {
    konstruksi: number;
    marketing: number;
    gaji: number;
    operasional: number;
    lain: number;
  };
  kasBersihOperasi: number;
  kasBersihInvestasi: number;
  kasBersihPendanaan: number;
  saldoAwal: number;
  saldoAkhir: number;
  saldoBukuBesar: number;
};

type LaporanClientProps = {
  activeTab: string;
  fromDate: string;
  toDate: string;
  projectFilter: string;
  projects: ProjectOption[];
  companyName: string;
  labaRugiData: LabaRugiData;
  neracaData: NeracaData;
  arusKasData: ArusKasData;
};

function formatRupiah(num: number) {
  return "Rp " + num.toLocaleString("id-ID");
}

function formatPeriodDate(dateValue: string) {
  if (!dateValue) return "";

  // Handle ISO-like value from <input type="date"> safely (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-");
    return `${month}/${day}/${year.slice(-2)}`;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

export default function LaporanClient({
  activeTab,
  fromDate,
  toDate,
  projectFilter,
  projects,
  companyName,
  labaRugiData,
  neracaData,
  arusKasData,
}: LaporanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const reportRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedFromDate, setSelectedFromDate] = useState(fromDate || "");
  const [selectedToDate, setSelectedToDate] = useState(toDate || "");
  const [selectedProject, setSelectedProject] = useState(projectFilter || "");
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(event.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-filter when selection changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (selectedFromDate !== (fromDate || "")) {
      if (selectedFromDate) params.set("from", selectedFromDate);
      else params.delete("from");
      changed = true;
    }
    if (selectedToDate !== (toDate || "")) {
      if (selectedToDate) params.set("to", selectedToDate);
      else params.delete("to");
      changed = true;
    }
    if (selectedProject !== (projectFilter || "")) {
      if (selectedProject) params.set("project", selectedProject);
      else params.delete("project");
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [selectedFromDate, selectedToDate, selectedProject, fromDate, toDate, projectFilter, pathname, router, searchParams]);

  const hideNativeDateIcon = `
    <style>
      input.custom-date::-webkit-calendar-picker-indicator {
        opacity: 0;
        display: block;
        width: 100%;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        cursor: pointer;
      }
      input.custom-date {
        position: relative;
      }
    </style>
  `;

  const handleFilterChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const from = selectedFromDate;
    const to = selectedToDate;
    const proj = selectedProject;
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    if (proj) params.set("project", proj);
    else params.delete("project");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const periodStart = selectedFromDate || selectedToDate;
  const periodEnd = selectedToDate || selectedFromDate;
  const periodLabel =
    periodStart && periodEnd
      ? `${formatPeriodDate(periodStart)} - ${formatPeriodDate(periodEnd)}`
      : "Semua Periode";

  const reportTitle =
    activeTab === "neraca"
      ? "Laporan Neraca"
      : activeTab === "arus_kas"
        ? "Laporan Arus Kas"
        : "Laporan Laba Rugi";

  // Export PDF
  const handleExportPDF = async () => {
    const loadImageAsPngDataUrl = (src: string) =>
      new Promise<string | null>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 256;
          canvas.height = img.naturalHeight || 256;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            resolve(null);
            return;
          }

          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        img.src = `${src}?v=${Date.now()}`;
      });

    const logoCandidates = ["/Icon.svg", "/icon_transparant.svg", "/logo.svg"];
    let logoDataUrl: string | null = null;

    for (const logoPath of logoCandidates) {
      // Try candidates from /public, stop at first successful load.
      logoDataUrl = await loadImageAsPngDataUrl(logoPath);
      if (logoDataUrl) break;
    }

    const pageWidth = 210;
    const pageHeight = 330;
    const left = 16;
    const right = pageWidth - 16;
    const lineHeight = 7;
    const pdf = new jsPDF("p", "mm", [pageWidth, pageHeight]);
    let y = 18;

    const ensureSpace = (needed = 10) => {
      if (y + needed > pageHeight - 16) {
        pdf.addPage([pageWidth, pageHeight], "p");
        y = 18;
      }
    };

    const writeCenter = (
      text: string,
      size: number,
      weight: "normal" | "bold",
    ) => {
      ensureSpace(8);
      pdf.setFont("helvetica", weight);
      pdf.setFontSize(size);
      pdf.text(text, pageWidth / 2, y, { align: "center" });
      y += 8;
    };

    const writeRow = (label: string, value: string, bold = false) => {
      ensureSpace(8);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(11);
      const wrapped = pdf.splitTextToSize(label, 120);
      pdf.text(wrapped, left, y);
      pdf.text(value, right, y, { align: "right" });
      y += Math.max(wrapped.length * 5, lineHeight);
    };

    const writeSection = (title: string) => {
      ensureSpace(12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(title, left, y);
      y += 3;
      pdf.line(left, y, right, y);
      y += 7;
    };

    if (logoDataUrl) {
      const logoWidth = 12;
      const logoHeight = 12;
      pdf.addImage(
        logoDataUrl,
        "PNG",
        (pageWidth - logoWidth) / 2,
        y - 5,
        logoWidth,
        logoHeight,
      );
      y += 10;
    }

    writeCenter(companyName, 14, "bold");
    writeCenter(periodLabel, 10, "normal");
    
    if (selectedProject) {
      const projName = projects.find(p => p.id === selectedProject)?.name || "";
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 116, 139); // text-slate-400
      pdf.text(`PROYEK: ${projName.toUpperCase()}`, pageWidth / 2, y - 2, { align: "center" });
      pdf.setTextColor(0, 0, 0); // reset
      y += 2;
    }

    y += 4;
    writeCenter(reportTitle, 16, "bold");
    y += 2;
    pdf.setDrawColor(229, 231, 235); // border-gray-200
    pdf.line(left, y, right, y);
    y += 10;

    if (activeTab === "laba_rugi") {
      writeSection("PENDAPATAN");
      writeRow(
        "Pendapatan Penjualan Unit",
        formatRupiah(labaRugiData.pendapatanPenjualan),
      );
      writeRow(
        "Pendapatan Lain-lain",
        formatRupiah(labaRugiData.pendapatanLainLain),
      );
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "TOTAL PENDAPATAN",
        formatRupiah(labaRugiData.totalPendapatanLR),
        true,
      );
      y += 5;
      writeRow("HPP - Umum", formatRupiah(labaRugiData.hppUmum));
      writeRow("Biaya Konstruksi", formatRupiah(labaRugiData.bebanKonstruksi));
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "TOTAL HARGA POKOK PENJUALAN",
        `(${formatRupiah(labaRugiData.hpp)})`,
        true,
      );
      y += 3;
      writeRow("LABA KOTOR", formatRupiah(labaRugiData.labaKotor), true);
      y += 2;
      pdf.line(left, y, right, y);
      y += 8;

      writeSection("BEBAN OPERASIONAL");
      writeRow("Beban Marketing", formatRupiah(labaRugiData.bebanMarketing));
      writeRow("Beban Gaji", formatRupiah(labaRugiData.bebanGaji));
      writeRow(
        "Beban Operasional",
        formatRupiah(labaRugiData.bebanOperasional),
      );
      writeRow("Beban Lain-lain", formatRupiah(labaRugiData.bebanLainLain));
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "TOTAL BEBAN OPERASIONAL",
        `(${formatRupiah(labaRugiData.totalBebanOperasional)})`,
        true,
      );
      y += 4;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "LABA (RUGI) BERSIH",
        formatRupiah(labaRugiData.labaBersih),
        true,
      );
    }

    if (activeTab === "neraca") {
      writeSection("ASET");
      writeRow("Kas", formatRupiah(neracaData.kas));
      writeRow("Bank", formatRupiah(neracaData.bank));
      writeRow("Piutang Pembeli", formatRupiah(neracaData.piutangPembeli));
      writeRow("Piutang KPR", formatRupiah(neracaData.piutangKPR));
      writeRow(
        "Persediaan Unit Siap Jual",
        formatRupiah(neracaData.persediaanUnit),
      );
      writeRow("BDK", formatRupiah(neracaData.bdk));
      writeRow("Tanah", formatRupiah(neracaData.tanah));
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow("TOTAL ASET", formatRupiah(neracaData.totalAset), true);

      y += 8;
      writeSection("KEWAJIBAN");
      writeRow(
        "Pendapatan Diterima di Muka",
        formatRupiah(neracaData.pendDiterimaDiMuka),
      );
      writeRow("Hutang Kontraktor", formatRupiah(neracaData.hutangKontraktor));
      writeRow("Hutang Usaha", formatRupiah(neracaData.hutangUsaha));
      writeRow("Hutang Bank", formatRupiah(neracaData.hutangBank));
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "TOTAL KEWAJIBAN",
        formatRupiah(neracaData.totalKewajiban),
        true,
      );

      y += 8;
      writeSection("EKUITAS");
      writeRow("Modal Disetor", formatRupiah(neracaData.modalDisetor));
      writeRow("Laba Ditahan", formatRupiah(neracaData.labaDitahan));
      writeRow("Laba Periode Berjalan", formatRupiah(neracaData.labaBersih));
      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow("TOTAL EKUITAS", formatRupiah(neracaData.totalEkuitas), true);
    }

    if (activeTab === "arus_kas") {
      writeSection("AKTIVITAS OPERASI - KAS MASUK");
      writeRow(
        "Booking Fee",
        formatRupiah(arusKasData.operasiMasuk.bookingFee),
      );
      writeRow(
        "Down Payment",
        formatRupiah(arusKasData.operasiMasuk.downPayment),
      );
      writeRow(
        "Pencairan KPR",
        formatRupiah(arusKasData.operasiMasuk.pencairanKPR),
      );
      writeRow(
        "Pelunasan Cash",
        formatRupiah(arusKasData.operasiMasuk.pelunasanCash),
      );
      if (arusKasData.operasiMasuk.penerimaanLainnya !== 0) {
        writeRow(
          "Penerimaan Lainnya",
          formatRupiah(arusKasData.operasiMasuk.penerimaanLainnya),
        );
      }

      y += 8;
      writeSection("AKTIVITAS OPERASI - KAS KELUAR");
      writeRow(
        "Konstruksi",
        formatRupiah(arusKasData.operasiKeluar.konstruksi),
      );
      writeRow("Marketing", formatRupiah(arusKasData.operasiKeluar.marketing));
      writeRow("Gaji", formatRupiah(arusKasData.operasiKeluar.gaji));
      writeRow(
        "Operasional",
        formatRupiah(arusKasData.operasiKeluar.operasional),
      );
      writeRow("Lain-lain", formatRupiah(arusKasData.operasiKeluar.lain));

      y += 1;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "KAS BERSIH AKTIVITAS OPERASI",
        formatRupiah(arusKasData.kasBersihOperasi),
        true,
      );
      writeRow(
        "KAS BERSIH AKTIVITAS INVESTASI",
        formatRupiah(arusKasData.kasBersihInvestasi),
        true,
      );
      writeRow(
        "KAS BERSIH AKTIVITAS PENDANAAN",
        formatRupiah(arusKasData.kasBersihPendanaan),
        true,
      );
      y += 2;
      pdf.line(left, y, right, y);
      y += 7;
      writeRow(
        "SALDO KAS AWAL PERIODE",
        formatRupiah(arusKasData.saldoAwal),
        true,
      );
      writeRow(
        "KENAIKAN/PENURUNAN KAS",
        formatRupiah(arusKasData.kasBersihOperasi),
        true,
      );
      writeRow(
        "SALDO KAS AKHIR PERIODE",
        formatRupiah(arusKasData.saldoAkhir),
        true,
      );
    }

    pdf.save(
      `Laporan_${activeTab}_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  const kewajibanEkuitas = neracaData.totalKewajiban + neracaData.totalEkuitas;
  const selisihNeraca = Math.abs(neracaData.totalAset - kewajibanEkuitas);
  const isNeracaBalanced = selisihNeraca <= 1000;

  return (
    <div className="text-gray-600 dark:text-gray-300 w-full h-full printable-area">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">
            Laporan Keuangan
          </h1>
          <p className="card-subtitle text-slate-500 dark:text-slate-400 mt-2">
            Laporan Laba Rugi, Neraca & Arus Kas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print w-full md:w-auto">
          <button
            onClick={() => {
              void handleExportPDF();
            }}
            className="px-5 h-11 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            Cetak PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR: Summary & Info */}
        <div className="w-full lg:w-[320px] space-y-5 no-print lg:sticky lg:top-6 self-start">
          {/* 1. Filter Toolbar Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-[0.5px] border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter Laporan</h4>
            <form onSubmit={handleFilterChange} className="space-y-3">
              <div dangerouslySetInnerHTML={{ __html: hideNativeDateIcon }} />
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Dari Tanggal</label>
                <div className="relative group">
                  <input
                    type="date"
                    name="from"
                    value={selectedFromDate}
                    onChange={(e) => setSelectedFromDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="custom-date w-full h-11 pl-3 pr-10 border-[0.5px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Sampai Tanggal</label>
                <div className="relative group">
                  <input
                    type="date"
                    name="to"
                    value={selectedToDate}
                    onChange={(e) => setSelectedToDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="custom-date w-full h-11 pl-3 pr-10 border-[0.5px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">Proyek</label>
                <div className="relative" ref={projectDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                    className="w-full h-11 flex items-center justify-between px-3 border-[0.5px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    <span className="truncate">{selectedProject ? projects.find(p => p.id === selectedProject)?.name : "Semua Proyek"}</span>
                    <svg className={`w-4 h-4 transition-transform ${projectDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {projectDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl p-1 overflow-hidden">
                      <button type="button" onClick={() => { setSelectedProject(""); setProjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedProject === "" ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"}`}>Semua Proyek</button>
                      {projects.map(p => (
                        <button key={p.id} type="button" onClick={() => { setSelectedProject(p.id); setProjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg ${selectedProject === p.id ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400"}`}>{p.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* 2. Segmented Switcher */}
          <div className="bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl flex flex-col gap-1">
            {[
              { id: "laba_rugi", label: "Laba Rugi", icon: <img src="/laba_rugi.svg" alt="" className="w-4 h-4 object-contain dark:invert dark:brightness-200" /> },
              { id: "neraca", label: "Neraca", icon: <img src="/balance.svg" alt="" className="w-4 h-4 object-contain dark:invert dark:brightness-200" /> },
              { id: "arus_kas", label: "Arus Kas", icon: <img src="/money.svg" alt="" className="w-4 h-4 object-contain dark:invert dark:brightness-200" /> }
            ].map((tab) => (
              <Link
                key={tab.id}
                href={`?tab=${tab.id}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border-[0.5px] border-slate-200 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/30"
                }`}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {tab.icon}
                </div>
                {tab.label}
              </Link>
            ))}
          </div>

          {/* 3. Summary Stats (Quick View) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-[0.5px] border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Angka</h4>
            <div className="space-y-4">
              {activeTab === "laba_rugi" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Laba Bersih</p>
                    <p className={`text-lg font-black ${labaRugiData.labaBersih >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(labaRugiData.labaBersih)}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-0.5">Total Pendapatan</p>
                    <p className="text-base font-bold text-slate-700 dark:text-slate-200">{formatRupiah(labaRugiData.totalPendapatanLR)}</p>
                  </div>
                </>
              )}
              {activeTab === "neraca" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Total Aset</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{formatRupiah(neracaData.totalAset)}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
                    <p className="text-xs text-slate-500">Status Balance</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isNeracaBalanced ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{isNeracaBalanced ? "OK" : "DIFFER"}</span>
                  </div>
                </>
              )}
              {activeTab === "arus_kas" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Saldo Kas Akhir</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{formatRupiah(arusKasData.saldoAkhir)}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-50 dark:border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-0.5">Arus Kas Operasi</p>
                    <p className={`text-base font-bold ${arusKasData.kasBersihOperasi >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(arusKasData.kasBersihOperasi)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT CONTENT: Report Preview */}
        <div className="flex-1 min-w-0">
          <div
            ref={reportRef}
            className="bg-white dark:bg-slate-800 rounded-2xl border-[0.5px] border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden p-8 lg:p-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative"
          >
            {/* Header Laporan (dalam kartu) */}
            <div className="mb-10 border-b border-gray-100 dark:border-slate-700 pb-8 text-center">
              <div className="flex flex-col items-center gap-3 mb-5">
                <img src="/Icon.svg" alt="Logo" className="w-12 h-12 object-contain" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{companyName}</h2>
                  <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                    {periodLabel}
                    {selectedProject && (
                      <span className="block text-slate-400 font-bold mt-0.5 uppercase tracking-wider text-[9px]">
                        Proyek: {projects.find(p => p.id === selectedProject)?.name}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{reportTitle}</h3>
            </div>

        {/* LABA RUGI */}
        {activeTab === "laba_rugi" && (
          <div className="text-sm space-y-4">
            <div id="lr-pendapatan" className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">
              PENDAPATAN
            </div>
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

            <div id="lr-hpp" className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
              HARGA POKOK PENJUALAN
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 pt-2">
              <span>HPP - Umum</span>
              <span>{formatRupiah(labaRugiData.hppUmum)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
              <span>Biaya Konstruksi</span>
              <span>{formatRupiah(labaRugiData.bebanKonstruksi)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>TOTAL HARGA POKOK PENJUALAN</span>
              <span>({formatRupiah(labaRugiData.hpp)})</span>
            </div>

            <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-b-2 border-slate-900 dark:border-slate-200 pb-2">
              <span>LABA KOTOR</span>
              <span>{formatRupiah(labaRugiData.labaKotor)}</span>
            </div>

            <div id="lr-beban" className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
              BEBAN OPERASIONAL
            </div>
            <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300 pt-2">
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

            <div
              className={`flex justify-between font-black text-lg border-y-2 border-slate-900 dark:border-slate-200 py-3 mt-4 ${labaRugiData.labaBersih >= 0 ? "text-[#16a34a]" : "text-red-600"}`}
            >
              <span>LABA (RUGI) BERSIH</span>
              <span>{formatRupiah(labaRugiData.labaBersih)}</span>
            </div>
          </div>
        )}

        {/* NERACA */}
        {activeTab === "neraca" && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-10 text-sm">
            {/* LSS Aset */}
            <div className="space-y-4">
              <div id="n-aset" className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">
                ASET
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1100 - Kas</span>
                <span>{formatRupiah(neracaData.kas)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1200 - Bank</span>
                <span>{formatRupiah(neracaData.bank)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1300 - Piutang Pembeli</span>
                <span>{formatRupiah(neracaData.piutangPembeli)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1400 - Piutang KPR</span>
                <span>{formatRupiah(neracaData.piutangKPR)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1500 - Persediaan Unit (Siap Jual)</span>
                <span>{formatRupiah(neracaData.persediaanUnit)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1600 - BDK</span>
                <span>{formatRupiah(neracaData.bdk)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>1700 - Tanah</span>
                <span>{formatRupiah(neracaData.tanah)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL ASET</span>
                <span>{formatRupiah(neracaData.totalAset)}</span>
              </div>
            </div>

            {/* RSS Kewa & Eku */}
            <div className="space-y-4">
              <div id="n-kewajiban" className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">
                KEWAJIBAN
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>2100 - Pendapatan Diterima di Muka</span>
                <span>{formatRupiah(neracaData.pendDiterimaDiMuka)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>2200 - Hutang Kontraktor</span>
                <span>{formatRupiah(neracaData.hutangKontraktor)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>2300 - Hutang Usaha</span>
                <span>{formatRupiah(neracaData.hutangUsaha)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>2400 - Hutang Bank</span>
                <span>{formatRupiah(neracaData.hutangBank)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL KEWAJIBAN</span>
                <span>{formatRupiah(neracaData.totalKewajiban)}</span>
              </div>

              <div id="n-ekuitas" className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg pt-4">
                EKUITAS
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>3100 - Modal Disetor</span>
                <span>{formatRupiah(neracaData.modalDisetor)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>3200 - Laba Ditahan</span>
                <span>{formatRupiah(neracaData.labaDitahan)}</span>
              </div>
              <div className="flex justify-between pl-2 text-slate-700 dark:text-slate-300">
                <span>Laba Periode Berjalan</span>
                <span>{formatRupiah(neracaData.labaBersih)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 dark:text-white text-base border-t-2 border-slate-800 pt-2 pb-4">
                <span>TOTAL EKUITAS</span>
                <span>{formatRupiah(neracaData.totalEkuitas)}</span>
              </div>

              <div
                className={`flex justify-between font-black text-lg border-y-2 border-slate-800 py-3 ${isNeracaBalanced ? "text-[#16a34a]" : "text-red-500"}`}
              >
                <span>TOTAL KEWAJIBAN & EKUITAS</span>
                <span>
                  {formatRupiah(
                    neracaData.totalKewajiban + neracaData.totalEkuitas,
                  )}
                </span>
              </div>
              {!isNeracaBalanced && (
                <div className="text-right text-xs font-bold text-red-500 uppercase mt-1">
                  ⚠ Neraca Tidak Balance! Selisih: {formatRupiah(selisihNeraca)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARUS KAS */}
        {activeTab === "arus_kas" && (
          <div className="text-sm space-y-4">
            <div id="ak-operasi" className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">
              AKTIVITAS OPERASI
            </div>
            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
              Penerimaan kas dari pembeli:
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Booking Fee</span>
              <span>{formatRupiah(arusKasData.operasiMasuk.bookingFee)}</span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Down Payment</span>
              <span>{formatRupiah(arusKasData.operasiMasuk.downPayment)}</span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Pencairan KPR</span>
              <span>{formatRupiah(arusKasData.operasiMasuk.pencairanKPR)}</span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Pelunasan Cash</span>
              <span>
                {formatRupiah(arusKasData.operasiMasuk.pelunasanCash)}
              </span>
            </div>
            {arusKasData.operasiMasuk.penerimaanLainnya !== 0 && (
              <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
                <span>Penerimaan Lainnya</span>
                <span>
                  {formatRupiah(arusKasData.operasiMasuk.penerimaanLainnya)}
                </span>
              </div>
            )}

            <div className="font-semibold text-slate-800 dark:text-slate-200 mt-4">
              Pengeluaran kas untuk operasi:
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Biaya Konstruksi</span>
              <span>
                ({formatRupiah(arusKasData.operasiKeluar.konstruksi)})
              </span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Biaya Marketing</span>
              <span>({formatRupiah(arusKasData.operasiKeluar.marketing)})</span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Biaya Gaji</span>
              <span>({formatRupiah(arusKasData.operasiKeluar.gaji)})</span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Biaya Operasional</span>
              <span>
                ({formatRupiah(arusKasData.operasiKeluar.operasional)})
              </span>
            </div>
            <div className="flex justify-between pl-6 text-slate-700 dark:text-slate-300">
              <span>Biaya Lain-lain</span>
              <span>({formatRupiah(arusKasData.operasiKeluar.lain)})</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS OPERASI</span>
              <span>{formatRupiah(arusKasData.kasBersihOperasi)}</span>
            </div>

            <div id="ak-investasi" className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
              AKTIVITAS INVESTASI
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS INVESTASI</span>
              <span>Rp 0</span>
            </div>

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
              AKTIVITAS PENDANAAN
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 pb-4 mt-2">
              <span>KAS BERSIH DARI AKTIVITAS PENDANAAN</span>
              <span>Rp 0</span>
            </div>

            <div className="flex justify-between font-black text-base border-y-2 border-slate-900 dark:border-slate-200 py-3 mt-8">
              <span>KENAIKAN/PENURUNAN KAS BERSIH</span>
              <span
                className={
                  arusKasData.kasBersihOperasi >= 0
                    ? "text-[#16a34a]"
                    : "text-red-500"
                }
              >
                {formatRupiah(arusKasData.kasBersihOperasi)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-sm pt-2 text-slate-600">
              <span>SALDO KAS AWAL PERIODE</span>
              <span>{formatRupiah(arusKasData.saldoAwal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-sm pt-2 text-slate-600">
              <span>KENAIKAN/PENURUNAN KAS</span>
              <span>{formatRupiah(arusKasData.kasBersihOperasi)}</span>
            </div>
            <div className="flex justify-between font-black text-lg border-t-2 border-slate-900 dark:border-slate-200 pt-3 mt-2 text-slate-900 dark:text-white">
              <span>SALDO KAS AKHIR PERIODE</span>
              <span>{formatRupiah(arusKasData.saldoAkhir)}</span>
            </div>
          </div>
        )}
       
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: 210mm 330mm; margin: 10mm; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; background: white; padding: 0;}
          .no-print { display: none !important; }
        }
      `,
        }}
      />
      <br />
    </div>
  );
}
