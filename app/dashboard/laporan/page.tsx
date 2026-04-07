import { prisma } from "@/lib/db";
import LaporanClient from "./LaporanClient";

export default async function LaporanKeuanganPage(props: {
  searchParams?: Promise<{ from?: string; to?: string; project?: string; tab?: string }>;
}) {
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";
  const activeTab = searchParams?.tab || "laba_rugi";

  const dateFilter: any = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate) dateFilter.lte = new Date(toDate + "T23:59:59");
  const dateWhereStr = (fromDate || toDate) ? { date: dateFilter } : {};
  const projectWhereStr = projectFilter ? { transaction: { projectId: projectFilter } } : {};

  // 1. Get all journals for the period
  const entries = await prisma.journalEntry.findMany({
    where: { ...dateWhereStr, ...projectWhereStr },
    include: {
      account: { select: { code: true, name: true, type: true, normalBalance: true } },
    },
  });

  const balances = new Map<string, number>(); // code -> balance
  // Helper to calculate exact balances
  for (const entry of entries) {
    const acc = entry.account;
    const kode = acc.code;
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    let net = 0;
    if (acc.normalBalance === "DEBIT") net = debit - credit;
    else net = credit - debit;

    balances.set(kode, (balances.get(kode) || 0) + net);
  }

  // --- TAHAP 2: LABA RUGI ---
  // Pendapatan Diakui
  const stUnits = await prisma.unit.findMany({
    where: {
      status: "SERAH_TERIMA",
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    include: {
      transactions: {
        where: {
          category: { in: ["PENCAIRAN_KPR", "PELUNASAN_CASH"] }
        }
      }
    }
  });

  let pendapatanPenjualan = 0;
  for (const unit of stUnits) {
    const totalTx = unit.transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (totalTx > 0) {
      pendapatanPenjualan += totalTx;
    } else {
      // fallback to 4100 if no transactions are found but it's ST
      pendapatanPenjualan += Number(unit.price); // Simple fallback, or could get from 4100.
    }
  }

  // Override pendapatanPenjualan if we don't have unit tx, use 4100 directly. 
  // Let's use 4100 from journals if the unit calculation yields 0, just to be safe.
  if (pendapatanPenjualan === 0) {
    pendapatanPenjualan = balances.get("4100") || 0;
  }
  
  const hpp = balances.get("5100") || 0;
  const labaKotor = pendapatanPenjualan - hpp;
  
  const bebanKonstruksi = balances.get("5200") || 0;
  const bebanMarketing = balances.get("5300") || 0;
  const bebanGaji = balances.get("5400") || 0;
  const bebanOperasional = balances.get("5500") || 0;
  const bebanLainLain = balances.get("5600") || 0;
  const pendapatanLainLain = balances.get("4200") || 0; // For completion

  const totalPendapatanLR = pendapatanPenjualan + pendapatanLainLain;
  const totalBebanOperasional = bebanKonstruksi + bebanMarketing + bebanGaji + bebanOperasional + bebanLainLain;
  const labaBersih = labaKotor - totalBebanOperasional + pendapatanLainLain;
  
  const labaRugiData = {
    pendapatanPenjualan,
    pendapatanLainLain,
    totalPendapatanLR,
    hpp,
    labaKotor,
    bebanKonstruksi,
    bebanMarketing,
    bebanGaji,
    bebanOperasional,
    bebanLainLain,
    totalBebanOperasional,
    labaBersih
  };


  // --- TAHAP 3: NERACA ---
  const kas = balances.get("1100") || 0;
  const bank = balances.get("1200") || 0;
  const piutangPembeli = balances.get("1300") || 0;
  
  const akadUnits = await prisma.unit.findMany({
    where: {
      status: "AKAD",
      customer: { paymentMethod: "KPR" },
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    include: { transactions: true }
  });
  
  let piutangKPR = 0;
  for (const u of akadUnits) {
    const paid = u.transactions.reduce((acc, t) => acc + Number(t.amount), 0);
    piutangKPR += (Number(u.price) - paid);
  }
  // Fallback to journal if zero
  if (piutangKPR === 0) piutangKPR = balances.get("1400") || 0;

  const tersediaUnits = await prisma.unit.aggregate({
    where: {
      status: "TERSEDIA",
      ...(projectFilter ? { projectId: projectFilter } : {})
    },
    _sum: { price: true }
  });
  const persediaanUnit = Number(tersediaUnits._sum.price || 0);

  const bdk = balances.get("1600") || 0;
  const tanah = balances.get("1700") || 0;
  const totalAset = kas + bank + piutangPembeli + piutangKPR + persediaanUnit + bdk + tanah;

  const pendDiterimaDiMuka = balances.get("2100") || 0;
  const hutangKontraktor = balances.get("2200") || 0;
  const hutangUsaha = balances.get("2300") || 0;
  const hutangBank = balances.get("2400") || 0;
  const totalKewajiban = pendDiterimaDiMuka + hutangKontraktor + hutangUsaha + hutangBank;

  const modalDisetor = balances.get("3100") || 0;
  const labaDitahan = balances.get("3200") || 0;
  const totalEkuitas = modalDisetor + labaDitahan + labaBersih;

  const neracaData = {
    kas, bank, piutangPembeli, piutangKPR, persediaanUnit, bdk, tanah, totalAset,
    pendDiterimaDiMuka, hutangKontraktor, hutangUsaha, hutangBank, totalKewajiban,
    modalDisetor, labaDitahan, labaBersih, totalEkuitas
  };


  // --- TAHAP 4: ARUS KAS ---
  // Aggregate transactions mapping logic
  const txFilter = {
    ...(fromDate || toDate ? { date: dateFilter } : {}),
    ...(projectFilter ? { projectId: projectFilter } : {})
  };

  const sums = await prisma.transaction.groupBy({
    by: ['category'],
    where: txFilter,
    _sum: { amount: true }
  });

  const getSum = (cat: string) => Number(sums.find(s => s.category === cat)?._sum.amount || 0);

  const cfOperasiMasuk = getSum('BOOKING_FEE') + getSum('DOWN_PAYMENT') + getSum('PENCAIRAN_KPR') + getSum('PELUNASAN_CASH');
  const cfOperasiKeluar = getSum('BIAYA_KONSTRUKSI') + getSum('BIAYA_MARKETING') + getSum('BIAYA_GAJI') + getSum('BIAYA_OPERASIONAL') + getSum('LAIN_LAIN');
  
  const arusKasData = {
    operasiMasuk: {
      bookingFee: getSum('BOOKING_FEE'),
      downPayment: getSum('DOWN_PAYMENT'),
      pencairanKPR: getSum('PENCAIRAN_KPR'),
      pelunasanCash: getSum('PELUNASAN_CASH')
    },
    operasiKeluar: {
      konstruksi: getSum('BIAYA_KONSTRUKSI'),
      marketing: getSum('BIAYA_MARKETING'),
      gaji: getSum('BIAYA_GAJI'),
      operasional: getSum('BIAYA_OPERASIONAL'),
      lain: getSum('LAIN_LAIN')
    },
    kasBersihOperasi: cfOperasiMasuk - cfOperasiKeluar,
    kasBersihInvestasi: 0,
    kasBersihPendanaan: 0,
    saldoAwal: 0, // Simplified, idealnya dihitung semua trx sblm fromDate 
    saldoAkhir: kas + bank
  };


  const projects = await prisma.project.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const company = await prisma.companyProfile.findFirst();

  return (
    <LaporanClient
      activeTab={activeTab}
      fromDate={fromDate}
      toDate={toDate}
      projectFilter={projectFilter}
      projects={projects}
      companyName={company?.name || "SIAGMS"}
      labaRugiData={labaRugiData}
      neracaData={neracaData}
      arusKasData={arusKasData}
    />
  );
}
