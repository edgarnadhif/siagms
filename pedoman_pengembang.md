# Kesimpulan & Pedoman Pengembangan Sistem SIAGMS

Dokumen ini berisi peta status fungsionalitas dari sistem **SIAGMS** (Sistem Informasi Akuntansi & Manajemen Real Estate). Dokumen ini ditujukan sebagai bentuk *handover* (serah terima) atau panduan (pedoman) bagi para pengembang (*Developer*) yang akan meneruskan pengerjaan proyek ini.

---

## ✅ Fitur yang Sudah Berjalan (Implemented & Functional)

Modul-modul di bawah ini merupakan fitur inti yang telah memiliki struktur Database (Prisma Schema), routing App Router Next.js, Antarmuka (UI), beserta Logika Bisnis (*Server Actions* atau API).

### 1. Autentikasi & Pengguna (Auth)
*   **Sistem Login & Register**: Otentikasi berbasis kombinasi Email & Password yang diamankan dengan `bcrypt`. Sistem mempertahankan *session* di *cookies*.
*   **Logout**: Fungsionalitas clearing session di *server side*.

### 2. Manajemen Data Properti & Konsumen
*   **Profil Perusahaan**: Fitur untuk menyimpan informasi identitas perusahaan (Nama, Alamat, Telepon, Email, Logo) yang tampil di Sidebar.
*   **Manajemen Projek**: *Create, Read, Update, Delete* (CRUD) untuk Proyek Perumahan. Termasuk informasi nilai budget, tanggal mulai/selesai, serta status proyek (Aktif, Selesai, Batal, Terjual).
*   **Master Unit**: Pencatatan detil masing-masing blok/unit rumah. Tersedia *state management* status unit (Tersedia, Booking, Indent, Akad, Lunas, Serah Terima).
*   **Pelanggan**: Data profil pelanggan yang komprehensif. Mencakup preferensi skema pembayaran (Cash/KPR), detil Bank KPR, dan plafon pencairan.

### 3. Akuntansi & Manajemen Keuangan Dasar
*   **Daftar Akun (Chart of Accounts)**: Penambahan akun standar akuntansi (Kode Akun, Tipe Aset/Hutang/Ekuitas/Pendapatan/Beban, dan ketentuan Saldo Normal).
*   **Transaksi (Kas Keluar-Masuk)**: Pencatatan operasional transaksi perusahaan (seperti DP, Booking Fee, Biaya Konstruksi/Marketing). Terhubung langsung dengan *Customer*, *Unit*, dan *Project*. 
*   **Jurnal Umum & Jurnal Otomatis**: 
    *   Mendukung pencatatan jurnal manual multi-baris asalkan Debit dan Kredit seimbang (*balanced*).
    *   **Auto-Journal (Jurnal Otomatis)**: Sistem memiliki abstraksi otomatisasi pencatatan jurnal saat sebuah Transaksi berhasil diinput (misalnya: DP akan secara otomatis menjurnal Bank di Debit dan Pendapatan Diterima di Muka di Kredit).
*   **Pengakuan Pendapatan (Revenue Recognition)**: Fungsional pelunasan dan proses Serah Terima Unit (BAST). Proses ini mentrigger otomatis jurnal pembalikan akun dari Pendapatan Diterima di Muka (Kewajiban) menjadi Pendapatan Penjualan Asli.

### 4. Pelaporan Keuangan (Financial Reporting)
*   **Buku Besar (General Ledger)**: Untuk mem-filter mutasi dan perputaran saldo kas/rekening dari waktu ke waktu.
*   **Neraca Saldo (Trial Balance)**: Memeriksa keseimbangan antara jumlah Debit dan Kredit di seluruh akun.
*   **Laporan Keuangan Fundamental**: Menyajikan *Laba Rugi*, *Neraca (Balance Sheet)*, dan *Arus Kas* yang ter-kalkulasi langsung di server secara abstrak dan dirender di *Client* berdasarkan kumpulan jurnal yang ada. 

### 5. Agenda & Visualisasi
*   **Kalender**: Fitur operasional untuk mencatat kegiatan tim, atau deadline *overdue*. Kalender mendeteksi input "Auto" (Aktivitas terbuat otomatis) maupun input "Manual".
*   **Dashboard Statistik**: Grafik/Card visual (*overview*) dari jumlah unit, pendapatan berjalan, maupun *shortcut* aktivitas hari ini.

---

## ❌ Fitur yang Belum Berjalan (Pending / To-Do)

Menu-menu ini sudah dibuatkan rangkanya (seperti di *Sidebar* & *Navigasi*), namun belum memiliki antarmuka (halaman tidak ditemukan/404) atau *Backend Action* yang berjalan. Hal ini menjadi **Prioritas atau RoadMap utama** bagi tim pengembang selanjutnya.

### 1. Manajemen Kuitansi & Invoicing (Receipts)
*   **Status**: Menu `Kuitansi` di Sidebar tersedia, tapi direktorinya (`/dashboard/kuitansi`) tidak ada/belum dibuat.
*   **Actionable Item**: Perlu dibuatkan halaman untuk *generate*, *preview*, dan cetak (print/PDF) Kuitansi Pembayaran yang secara dinamis mengambil data berdasarkan `Reference ID` Transaksi. 

### 2. Kelola User / Role Management 
*   **Status**: Schema `User` memiliki enum Role (`USER`, `ADMIN`), dan Menu `Kelola User` tertera di Sidebar. Namun halamannya webnya (`/dashboard/users`) belum dibuat.
*   **Actionable Item**: Dibuatkan halaman bagi `ADMIN` untuk melihat semua daftar staf. Ditambah fitur tambah staf baru, reset password staf, dan penentuan limitasi akses operasional per modul (contoh: Staf Marketing tidak boleh mengubah Jurnal Akuntansi, dsb).

### 3. Panduan / Dokumentasi Internal (User Guide)
*   **Status**: Tombol "Panduan" di menu pengaturan (`/dashboard/panduan`) masih membidik URL kosong belum ada isinya.
*   **Actionable Item**: Membuat Halaman `.tsx` berisi FAQ statis / Tutorial cara menggunakan *SIAGMS*, menjelaskan Standar Operasional Prosedur (SOP) kepada admin/karyawan saat ingin menerima Booking Fee, dan sebagainya.

### 4. Ekspor/Import Data Terpusat (Excel/PDF via API)
*   **Status**: Tampilan laporan sudah memuat desain yang elegan dan *print-ready* secara *native browser*, namun fitur dedikasi *Download as .xlsx* atau Backup Database belum terautomasi.
*   **Actionable Item**: Mengintegrasikan *library* pendukung, misalnya `exceljs` atau `xlsx` pada app router REST *Endpoint* (`/api`), sehingga data tabel bisa dengan gampang ditarik (diunduh) oleh staff operasional / akuntan perusahaan untuk arsip fisik/audit.

### 5. File & Image Storage Lanjutan (Upload Foto/Bukti Gambar)
*   **Status**: Pada bagian Profil Perusahaan, saat ini dukungan unggah (upload) logo/identitas masih sebatas menyimpan *URL string* statik, bukan upload file betulan. Belum ada area untuk melampirkan foto resi di transaksi.
*   **Actionable Item**: Mengimplementasikan file storage app/uploader (seperti memproses file lokal ke folder server, atau menyambungkan infrastruktur pihak ketiga seperti Supabase Storage / AWS S3/ Cloudinary).

### 6. Notifikasi Alerting
*   **Status**: Agenda pengingat (kalender) tercatat, tapi sistem tidak pro-aktif memberitahu user (harus melihat dengan tatap-mata pada UI kalender terlebih dahulu).
*   **Actionable Item**: Pengembangan *Push Notification* dan Integrasi SMTP (Nodemailer, Resend) untuk mengirimkan Email Pengingat ketika tagihan Angsuran pelanggan akan jatuh tempo.

---

### Catatan Penting untuk Engineer / Eksekusi Arsitektur Selanjutnya
1.  **Teknologi Stack**: Sistem menggunakan **Next.js 14+ (App Router)** terintegrasi dengan **Prisma ORM** (PostgreSQL) serta styling antarmuka berbasis **TailwindCSS**. Modul pertukaran data mayoritas dikendalikan menggunakan Server Component & Server Actions (cek `app/actions.ts`), yang akan mendistribusikan *state* menuju Client Components (`*Client.tsx`).
2.  **Desain UI/UX**: Sistem telah diarahkan kepada koridor *premium brand identity* dengan gaya dominasi palet warna *Orange/Autum* (serta disematkannya *Dark Mode* otomatis yang mewah pada sidebar). Pengembang ditekankan untuk menggunakan aset maupun CSS yang serasi dan tidak menambahkan struktur antarmuka yang tabrakan (selalu mengacu pada *existing rules style* yang mendasari `globals.css`!).
3.  **Database Migration**: Jangan lupa selalu menjalankan perintah `npx prisma db push` atau `npx prisma migrate dev` jika Anda mengembangkan fitur terpenting dan menambah struktur tabel baru di masa mendatang.
