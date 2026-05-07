"use client";

import { useState } from "react";

interface InsightData {
  ringkasan: string;
  perhatian: string[];
  positif: string[];
  saran: string[];
}

interface FinancialData {
  projectName: string;
  kasDiterima: number;
  pendapatanDiakui: number;
  totalBeban: number;
  labaBersih: number;
  bebanKonstruksi: number;
  bebanMarketing: number;
  bebanGaji: number;
  bebanOperasional: number;
  unitTersedia: number;
  unitTerjual: number;
  unitSerahTerima: number;
  piutangKPR: number;
  totalAset: number;
  neracaStatus: string;
}

function SectionIcon({ type }: { type: "summary" | "warning" | "good" | "idea" }) {
  const className = "h-3.5 w-3.5";

  if (type === "warning") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  }

  if (type === "good") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }

  if (type === "idea") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-1.5m0 0a6 6 0 1 0-3.6-1.2c.9.67 1.6 1.28 1.6 1.2h4c0 .08.7-.53 1.6-1.2A6 6 0 0 0 12 6v10.5ZM10 21h4" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5" />
    </svg>
  );
}

function InsightSection({
  title,
  items,
  children,
  tone,
  icon,
}: {
  title: string;
  items?: string[];
  children?: React.ReactNode;
  tone: string;
  icon: "summary" | "warning" | "good" | "idea";
}) {
  return (
    <div className={`rounded-xl border p-3 ${tone}`}>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
        <SectionIcon type={icon} />
        {title}
      </p>
      {children}
      {items && (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex items-start gap-1.5 text-sm leading-relaxed text-gray-700 dark:text-slate-300">
              <span className="mt-0.5 shrink-0">-</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AIInsightCard({
  financialData,
}: {
  financialData: FinancialData;
}) {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialData }),
      });

      const data = await res.json();

      if (data.success) {
        setInsight(data.data);
        setHasLoaded(true);
        setAnalyzedAt(new Date().toLocaleString("id-ID"));
      } else {
        setError(data.message || "Gagal mendapatkan analisis AI");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75 9 6m5.25-2.25L15 6M5.25 8.25h13.5M6.75 21h10.5A2.25 2.25 0 0 0 19.5 18.75v-8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 10.5v8.25A2.25 2.25 0 0 0 6.75 21Zm3-7.5h.01m4.49 0h.01M9.75 17.25h4.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              AI Financial Insight
            </h3>
            <p className="text-xs text-slate-400">Powered by Google Gemini</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInsight}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {loading ? "Menganalisis..." : hasLoaded ? "Analisis Ulang" : "Mulai Analisis"}
        </button>
      </div>

      {!hasLoaded && !loading && !error && (
        <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Klik &quot;Mulai Analisis&quot; untuk mendapatkan insight keuangan dari AI
          </p>
          <p className="mt-1 text-xs text-slate-400">
            AI akan menganalisis data keuangan proyek yang sedang ditampilkan
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
          <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-orange-100 dark:bg-orange-500/20" />
          <p className="text-sm">AI sedang menganalisis data keuangan...</p>
          <p className="mt-1 text-xs text-slate-400">Mohon tunggu beberapa saat</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <SectionIcon type="warning" />
          <span>{error}</span>
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-3">
          <InsightSection
            title="Ringkasan"
            tone="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/20 dark:text-orange-300"
            icon="summary"
          >
            <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300">
              {insight.ringkasan}
            </p>
          </InsightSection>

          {insight.perhatian?.length > 0 && (
            <InsightSection
              title="Perhatian"
              items={insight.perhatian}
              tone="border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-yellow-300"
              icon="warning"
            />
          )}

          {insight.positif?.length > 0 && (
            <InsightSection
              title="Positif"
              items={insight.positif}
              tone="border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300"
              icon="good"
            />
          )}

          {insight.saran?.length > 0 && (
            <InsightSection
              title="Saran"
              items={insight.saran}
              tone="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300"
              icon="idea"
            />
          )}

          {analyzedAt && (
            <p className="text-right text-xs text-slate-400">
              Dianalisis pada {analyzedAt}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
