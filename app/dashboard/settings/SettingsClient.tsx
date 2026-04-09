"use client";

import React, { useState } from "react";
import { cleanupDuplicateSTJournals } from "@/app/actions";

export default function SettingsClient({ actionType }: { actionType: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCleanupST = async () => {
    if (!confirm("Konfirmasi perbaikan jurnal ST BA-ST yang dobel atau nominalnya salah? Aksi ini tidak dapat dibatalkan.")) return;
    setLoading(true);
    try {
      const res = await cleanupDuplicateSTJournals();
      setResult(res);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (actionType === "cleanupST") {
    return (
      <div className="space-y-4">
        <button
          onClick={handleCleanupST}
          disabled={loading}
          className="w-full h-12 bg-[#EA6C00] hover:bg-[#C25500] disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Perbaiki Jurnal ST"
          )}
        </button>

        {result && (
          <div className={`p-4 rounded-xl text-sm font-bold border ${
            result.error 
              ? "bg-red-50 text-red-600 border-red-100" 
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}>
            {result.error || result.message}
          </div>
        )}
      </div>
    );
  }

  return null;
}
