"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { updateProject } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { ProjectCardProject } from "./ProjectCard";

interface EditProjectModalProps {
  project: ProjectCardProject;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "AKTIF", label: "Aktif", color: "bg-emerald-500" },
  { value: "SELESAI", label: "Selesai", color: "bg-blue-500" },
  { value: "BATAL", label: "Batal", color: "bg-gray-500" },
];

export default function EditProjectModal({
  project,
  onClose,
}: EditProjectModalProps) {
  const [state, formAction, isPending] = useActionState(updateProject, null);
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(project.status);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state, router, onClose]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDateForInput = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[16px] w-full max-w-lg shadow-2xl overflow-hidden relative border border-gray-100 dark:border-slate-700">
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8">
            Edit Proyek
          </h2>

          <form action={formAction} className="space-y-5">
            {/* Hidden ID */}
            <input type="hidden" name="id" value={project.id} />

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Kode Proyek *
                </label>
                <input
                  required
                  type="text"
                  name="code"
                  defaultValue={project.code}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all"
                />
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Status *
                </label>
                <input type="hidden" name="status" value={selectedStatus} />
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-[10px] text-sm transition-all outline-none ${
                    isOpen 
                      ? "border-[#EA6C00] ring-[3px] ring-[#EA6C00]/10 bg-white dark:bg-slate-800" 
                      : "border-[#E5E7EB] dark:border-slate-600 bg-transparent"
                  }`}
                >
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {STATUS_OPTIONS.find(opt => opt.value === selectedStatus)?.label}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[12px] shadow-xl overflow-hidden p-1.5 animate-in slide-in-from-top-2 duration-200">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(option.value as typeof project.status);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-3 ${
                          selectedStatus === option.value
                            ? "bg-[#EA6C00] text-white"
                            : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${option.color} ${selectedStatus === option.value ? "bg-white" : ""}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Nama Proyek *
              </label>
              <input
                required
                type="text"
                name="name"
                defaultValue={project.name}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Deskripsi Proyek
              </label>
              <textarea
                name="description"
                defaultValue={project.description || ""}
                rows={3}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Lokasi *
              </label>
              <input
                required
                type="text"
                name="location"
                defaultValue={project.location || ""}
                placeholder="Lokasi proyek"
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={formatDateForInput(project.startDate)}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                  Target Selesai
                </label>
                <input
                  type="date"
                  name="endDate"
                  defaultValue={formatDateForInput(project.endDate)}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Budget (Rp) *
              </label>
              <input
                type="number"
                name="budget"
                min="1000000"
                required
                defaultValue={Number(project.budget) || ""}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] dark:border-slate-600 rounded-[10px] text-sm bg-transparent text-gray-900 dark:text-gray-100 focus:border-[#EA6C00] focus:ring-[3px] focus:ring-[#EA6C00]/10 outline-none transition-all"
              />
            </div>

            {state?.error && (
              <div className="text-red-500 text-xs font-semibold mt-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-[10px] border border-red-100 dark:border-red-900/20">
                {state.error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-gray-100 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-[#E5E7EB] rounded-[10px] hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-2.5 text-sm font-bold text-white bg-[#EA6C00] hover:bg-[#C25500] rounded-[10px] shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
