export default function LoadingProjects() {
  return (
    <div className="bg-gray-100 dark:bg-[#0f172a] border-2 border-gray-200 dark:border-gray-800 rounded-2xl pt-4 md:p-5 md:pt-5 min-h-[calc(100vh-80px)] shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-6 px-4 md:px-0">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-72 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
      </div>

      <div className="px-4 md:px-0 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 border border-[#F3F4F6] dark:border-slate-700/50 rounded-2xl p-5 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-32 rounded-xl bg-gray-200 dark:bg-slate-700" />
                  <div className="h-6 w-16 rounded-full bg-gray-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-4 w-full rounded bg-gray-200 dark:bg-slate-700" />
                </div>
                <div className="h-24 rounded-xl bg-gray-200 dark:bg-slate-700" />
                <div className="h-20 rounded-xl bg-gray-200 dark:bg-slate-700" />
                <div className="h-12 rounded-xl bg-gray-200 dark:bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
