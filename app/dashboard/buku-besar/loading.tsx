export default function LoadingBukuBesar() {
  return (
    <div className="border-2 shadow-xl border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-100 dark:bg-[#0f172a] pt-4 md:p-5 md:pt-5 min-h-screen">
      <div className="px-4 md:px-0 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-72 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="h-11 w-56 bg-gray-200 dark:bg-slate-700 rounded-xl" />
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50 p-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
                <div className="h-11 w-full bg-gray-200 dark:bg-slate-700 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-28 bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50" />
          <div className="h-28 bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50" />
        </div>

        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-72 bg-white dark:bg-slate-800 rounded-[14px] border border-[#E5E7EB] dark:border-slate-700/50" />
        ))}
      </div>
    </div>
  );
}
