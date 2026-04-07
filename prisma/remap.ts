import { prisma } from '../lib/db';

async function main() {
  console.log('Memulai proses remapping JournalEntry dan Hard Delete Akun Invalid...');

  await prisma.$transaction(async (tx) => {
    // 1. MAPPING AKUN LAMA KE AKUN BARU
    const mappings = [
      { oldCodes: ['1-100', '1-1000', '1-110'], newCode: '1100' },
      { oldCodes: ['1-200'], newCode: '1300' },
      { oldCodes: ['2-100', '2-1000'], newCode: '2100' },
      { oldCodes: ['4-100', '4-1000'], newCode: '4100' },
      { oldCodes: ['5-100', '5-1000'], newCode: '5200' },
      { oldCodes: ['5-200', '5-2000'], newCode: '5500' },
    ];

    for (const mapping of mappings) {
      // Cari akun standar yang baru
      const newAcc = await tx.account.findUnique({ where: { code: mapping.newCode } });
      if (!newAcc) {
        console.warn(`[SKIP] Standar akun ${mapping.newCode} tidak ditemukan.`);
        continue;
      }

      // Cari semua akun lama bedasarkan oldCodes
      const oldAccs = await tx.account.findMany({
        where: { code: { in: mapping.oldCodes } }
      });

      for (const oldAcc of oldAccs) {
        if (oldAcc.id !== newAcc.id) { // pastikan bukan akun yang sama
           // Pindahkan semua JournalEntry dari oldAcc ke newAcc
           const result = await tx.journalEntry.updateMany({
             where: { accountId: oldAcc.id },
             data: { accountId: newAcc.id }
           });
           console.log(`✅ Berhasil memindahkan ${result.count} Jurnal dari akun lama [${oldAcc.code}] ke akun baru [${newAcc.code}]`);
        }
      }
    }

    // 2. IDENTIFIKASI & HARD DELETE AKUN INVALID
    // Ambil SEMUA akun untuk diproses
    const allAccounts = await tx.account.findMany();
    
    // Filter akun yang BUKAN format 4 digit angka (misal "as", "a-100") ATAU kode lama ("1-100")
    // Pokoknya, apapun yang tidak 'match' persis dengan pola 4 digit (1000-5999) wajib dihapus.
    const invalidAccounts = allAccounts.filter(a => !/^[1-5]\d{3}$/.test(a.code));
    
    const invalidIds = invalidAccounts.map(a => a.id);

    if (invalidIds.length > 0) {
       console.log(`Menemukan ${invalidIds.length} akun invalid untuk dihapus...`);
       invalidAccounts.forEach(a => console.log(` - akan dihapus: ${a.code} (${a.name})`));

       // A) Hapus semua JournalEntry yang nyangkut di akun invalid ini (supaya tidak kena FK error delete RESTRICT)
       const deletedJE = await tx.journalEntry.deleteMany({
         where: { accountId: { in: invalidIds } }
       });
       console.log(`🗑️ Berhasil menghapus ${deletedJE.count} JournalEntry terkait akun invalid (biasanya data testing/sampah)`);
       
       // B) HARD DELETE AKUN
       const deletedAcc = await tx.account.deleteMany({
         where: { id: { in: invalidIds } }
       });
       console.log(`💥 HARD DELETE selesai: ${deletedAcc.count} Akun invalid terhapus selamanya.`);
    } else {
       console.log('Tidak ada akun invalid/kotor yang perlu dihapus.');
    }
  });

  console.log('Semua proses remapping & pembersihan Data Master selesai!');
}

main()
  .catch((e) => {
    console.error('ERROR SEEDING:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
