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
  hpp: number;
  labaKotor: number;
  bebanKonstruksi: number;
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
  const [fromDateFocused, setFromDateFocused] = useState(false);
  const [toDateFocused, setToDateFocused] = useState(false);
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

    const companyLineY = y;
    writeCenter(companyName, 18, "bold");

    if (logoDataUrl) {
      const logoWidth = 14;
      const logoHeight = 14;
      // Place logo on the left side of header, aligned with company-name row.
      pdf.addImage(
        logoDataUrl,
        "PNG",
        left,
        companyLineY - 5,
        logoWidth,
        logoHeight,
      );
    }

    writeCenter(reportTitle, 14, "bold");
    writeCenter(`Periode: ${periodLabel}`, 11, "normal");
    y += 2;
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
      y += 3;
      writeRow(
        "HARGA POKOK PENJUALAN",
        `(${formatRupiah(labaRugiData.hpp)})`,
        true,
      );
      y += 3;
      writeRow("LABA KOTOR", formatRupiah(labaRugiData.labaKotor), true);
      y += 2;
      pdf.line(left, y, right, y);
      y += 8;

      writeSection("BEBAN OPERASIONAL");
      writeRow("Beban Konstruksi", formatRupiah(labaRugiData.bebanKonstruksi));
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-4 md:px-0">
        <div>
          <h1 className="page-title dark:text-gray-100">Laporan Keuangan</h1>
          <p className="card-subtitle text-gray-400 dark:text-gray-400 mt-3">
            Laporan Laba Rugi, Neraca & Arus Kas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print w-full md:w-auto">
          <button
            onClick={() => {
              void handleExportPDF();
            }}
            className="px-5 h-10 bg-[#EA6C00] hover:bg-[#C25500] text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            Cetak PDF
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="sticky -top-6 z-30 pt-8 pb-4 bg-white dark:bg-[#111827] -mx-6 px-6 no-print mb-6">
        <form
          onSubmit={handleFilterChange}
          className="bg-white dark:bg-slate-800 rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-1.5 min-h-14 md:h-14 shadow-sm relative focus-within:ring-2 focus-within:ring-[#EA6C00]/10 focus-within:border-[#EA6C00] transition-all"
        >
          <div dangerouslySetInnerHTML={{ __html: hideNativeDateIcon }} />
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 w-full relative group">
              {!selectedFromDate && !fromDateFocused && (
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-200 pointer-events-none">
                  Dari Tanggal
                </span>
              )}
              <input
                type="date"
                name="from"
                value={selectedFromDate}
                onChange={(e) => setSelectedFromDate(e.target.value)}
                onFocus={() => setFromDateFocused(true)}
                onBlur={() => setFromDateFocused(false)}
                onClick={(e) => e.currentTarget.showPicker()}
                className={`custom-date w-full h-11 pl-5 pr-12 border-0 bg-transparent text-sm font-bold focus:ring-0 cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedFromDate || fromDateFocused ? "text-gray-700 dark:text-gray-200" : "text-transparent"}`}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <img
                  src="/calendar_month.svg"
                  alt=""
                  className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-slate-700 mx-1" />

            <div className="flex-1 w-full relative group">
              {!selectedToDate && !toDateFocused && (
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-700 dark:text-gray-200 pointer-events-none">
                  Sampai Tanggal
                </span>
              )}
              <input
                type="date"
                name="to"
                value={selectedToDate}
                onChange={(e) => setSelectedToDate(e.target.value)}
                onFocus={() => setToDateFocused(true)}
                onBlur={() => setToDateFocused(false)}
                onClick={(e) => e.currentTarget.showPicker()}
                className={`custom-date w-full h-11 pl-5 pr-12 border-0 bg-transparent text-sm font-bold focus:ring-0 cursor-pointer rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${selectedToDate || toDateFocused ? "text-gray-700 dark:text-gray-200" : "text-transparent"}`}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                <img
                  src="/calendar_month.svg"
                  alt=""
                  className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>

            <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-slate-700 mx-1" />

            <div className="flex-1 w-full relative" ref={projectDropdownRef}>
              <button
                type="button"
                onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                className="w-full h-11 pl-5 pr-10 border-0 bg-transparent text-sm font-bold text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                {selectedProject
                  ? projects.find((p) => p.id === selectedProject)?.name ||
                    "Semua Proyek"
                  : "Semua Proyek"}
              </button>
              <svg
                className={`w-4 h-4 text-gray-300 absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${projectDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {projectDropdownOpen && (
                <div className="absolute z-50 right-0 mt-3 w-full min-w-[260px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden flex flex-col p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProject("");
                      setProjectDropdownOpen(false);
                    }}
                    className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${selectedProject === "" ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Proyek
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProject(p.id);
                        setProjectDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-2.5 text-sm font-bold rounded-lg transition-colors ${selectedProject === p.id ? "bg-[#EA6C00] text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {p.code} - {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pl-2 pr-1">
              <button
                type="submit"
                className="w-9 h-9 bg-[#EA6C00] text-white rounded-full shadow-lg shadow-orange-500/20 flex items-center justify-center shrink-0 hover:bg-[#C25500] hover:scale-105 active:scale-95 transition-all"
                title="Terapkan Filter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-4.5 h-4.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-8 no-print px-4 md:px-0">
        {["laba_rugi", "neraca", "arus_kas"].map((tab) => (
          <Link
            key={tab}
            href={`?tab=${tab}${fromDate ? `&from=${fromDate}` : ""}${toDate ? `&to=${toDate}` : ""}${projectFilter ? `&project=${projectFilter}` : ""}`}
            className={`px-6 h-11 flex items-center justify-center text-xs font-black uppercase tracking-widest rounded-full transition-all ${
              activeTab === tab
                ? "bg-[#EA6C00] text-white shadow-lg shadow-orange-500/20"
                : "bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
            }`}
          >
            {tab.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div
        ref={reportRef}
        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden p-8 w-full max-w-[210mm] mx-auto"
        style={{ minHeight: "330mm" }}
      >
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 shrink-0 pt-1">
              <img
                src="/Icon.svg"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="flex-1 text-center -ml-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                {companyName}
              </h2>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1 leading-tight">
                {reportTitle}
              </h3>
              <p className="text-base font-medium text-slate-900 dark:text-white mt-2">
                Periode: {periodLabel}
              </p>
            </div>
          </div>
        </div>

        {/* LABA RUGI */}
        {activeTab === "laba_rugi" && (
          <div className="max-w-4xl mx-auto text-sm space-y-4">
            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">
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

            <div className="flex justify-between font-bold text-slate-900 dark:text-white pb-4">
              <span>HARGA POKOK PENJUALAN</span>
              <span>({formatRupiah(labaRugiData.hpp)})</span>
            </div>

            <div className="flex justify-between font-black text-[#EA6C00] text-base border-b-2 border-slate-900 dark:border-slate-200 pb-2">
              <span>LABA KOTOR</span>
              <span>{formatRupiah(labaRugiData.labaKotor)}</span>
            </div>

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
              BEBAN OPERASIONAL
            </div>
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
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 text-sm">
            {/* LSS Aset */}
            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">
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
              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg">
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

              <div className="font-black text-slate-900 dark:text-white border-b-4 border-slate-800 dark:border-slate-200 pb-2 text-lg pt-4">
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
          <div className="max-w-4xl mx-auto text-sm space-y-4">
            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 text-slate-900 dark:text-slate-100">
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

            <div className="font-bold border-b-2 border-slate-900 dark:border-slate-200 pb-2 pt-4 text-slate-900 dark:text-slate-100">
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
            <div className="flex justify-between font-black text-lg border-t-2 border-slate-900 dark:border-slate-200 pt-3 mt-2 text-[#EA6C00]">
              <span>SALDO KAS AKHIR PERIODE</span>
              <span>{formatRupiah(arusKasData.saldoAkhir)}</span>
            </div>
          </div>
        )}
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
    </div>
  );
}
