const fs = require('fs');
const path = 'app/dashboard/pelanggan/PelangganClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update constants
content = content.replace(
  /const inputCls =\s+"[^"]+";/g,
  `const inputCls =
  "w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all";`
);
content = content.replace(
  /const labelCls =\s+"[^"]+";/g,
  `const labelCls = "text-sm font-medium text-slate-600 mb-1.5 block";`
);
content = content.replace(
  /const readonlyCls =\s+"[^"]+";/g,
  `const readonlyCls =
  "w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed flex items-center transition-colors";`
);

// Update Modal Header
content = content.replace(
  /<h2 className="text-xl font-bold text-slate-800 dark:text-white">\s*Edit Pelanggan\s*<\/h2>/g,
  `<h2 className="text-xl font-semibold text-slate-900">
                  Edit Pelanggan
                </h2>`
);
content = content.replace(
  /<p className="text-xs text-gray-400 mt-0.5">\s*Perbarui data \{editCustomer.name\}\s*<\/p>/g,
  `<p className="text-sm text-slate-500 mt-0.5">
                  Perbarui data {editCustomer.name}
                </p>`
);

// Update Close Button
content = content.replace(
  /<button\s+onClick=\{\(\) => setEditCustomer\(null\)\}\s+className="text-slate-400 hover:text-slate-600"\s*>/g,
  `<button
                onClick={() => setEditCustomer(null)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >`
);

// Update Form Scrollbar and Read-only Section
content = content.replace(
  /<form\s+onSubmit=\{handleEditCustomer\}\s+className="overflow-y-auto flex-1"\s*>/g,
  `<form
              onSubmit={handleEditCustomer}
              className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full"
            >`
);

content = content.replace(
  /className="bg-gray-50 dark:bg-slate-900\/50 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-slate-700"/g,
  `className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4"`
);

content = content.replace(
  /<h3 className="text-\[11px\] font-black text-gray-400 uppercase tracking-widest">\s*Informasi Read-Only\s*<\/h3>/g,
  `<h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Informasi Read-only
                  </h3>`
);

// Update Labels
content = content.replace(/Nama Lengkap \*/g, 'Nama Lengkap *'); // Already Title Case
content = content.replace(/No HP \*/g, 'Nomor HP *');
content = content.replace(/Alamat Lengkap \*/g, 'Alamat Lengkap *');
content = content.replace(/Email<\/label>/g, 'Email (opsional)</label>');

// Update Textarea
content = content.replace(
  /className={`w-full p-4 rounded-\[10px\] border bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white focus:ring-4 focus:ring-\[#EA6C00\]\/10 focus:border-\[#EA6C00\] outline-none transition-all placeholder-gray-400 \$\{editErrors\.address \? "border-red-400" : "border-gray-200 dark:border-slate-700"\}\`}/g,
  'className={`w-full min-h-[88px] px-4 py-3 rounded-xl border bg-white text-sm text-slate-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 ${editErrors.address ? "border-red-400" : "border-slate-200"}`}'
);

// Update Footer and Buttons
content = content.replace(
  /className="p-5 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50\/50 dark:bg-slate-800\/30"/g,
  `className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3"`
);

// Batal button in Edit Modal
content = content.replace(
  /<button\s+type="button"\s+onClick=\{\(\) => setEditCustomer\(null\)\}\s+className="px-5 h-11 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-\[10px\] transition-all"\s*>\s*Batal\s*<\/button>/g,
  `<button
                  type="button"
                  onClick={() => setEditCustomer(null)}
                  className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>`
);

// Simpan button in Edit Modal
content = content.replace(
  /className="px-6 h-11 bg-\[#EA6C00\] hover:bg-\[#C25500\] text-white text-sm font-bold rounded-\[10px\] shadow-lg shadow-orange-500\/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"/g,
  'className="h-11 px-5 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"'
);

fs.writeFileSync(path, content);
console.log('Successfully updated PelangganClient.tsx');
