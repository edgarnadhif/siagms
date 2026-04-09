import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import LaporanClient from "./LaporanClient";

const PENDAPATAN_DIAKUI_CATEGORIES = [
  "BOOKING_FEE",
  "DOWN_PAYMENT",
  "PENCAIRAN_KPR",
  "PELUNASAN_CASH",
] as const;

const LABA_RUGI_BEBAN_CATEGORIES = [
  "BIAYA_KONSTRUKSI",
  "BIAYA_MARKETING",
  "BIAYA_GAJI",
  "BIAYA_OPERASIONAL",
  "LAIN_LAIN",
] as const;

export default async function LaporanKeuanganPage(props: {
  searchParams?: Promise<{ from?: string; to?: string; project?: string; tab?: string }>;
}) {
  const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
  const searchParams = await props.searchParams;
  const fromDate = searchParams?.from || "";
  const toDate = searchParams?.to || "";
  const projectFilter = searchParams?.project || "";
  const activeTab = searchParams?.tab || "laba_rugi";

  const dateFilter: any = {};
  if (fromDate) dateFilter.gte = new Date(fromDate);
  if (toDate) dateFilter.lte = new Date(toDate + "T23:59:59");
  const dateWhereStr = (fromDate || toDate) ? { date: dateFilter } : {};
  const projectWhereStr = projectFilter
    ? {
        OR: [
          { unit: { is: { projectId: projectFilter } } },
          { transaction: { is: { unit: { projectId: projectFilter } } } },
          { transaction: { is: { projectId: projectFilter, unitId: null } } },
        ],
      }
    : {};

  // 1. Get all journals for the period
  const entries = await prisma.journalEntry.findMany({
    where: { tenantId: auth.tenantId, ...dateWhereStr, ...projectWhereStr },
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

  const sumByPrefix = (prefix: string) =>
    Array.from(balances.entries())
      .filter(([code]) => code.startsWith(prefix))
      .reduce((sum, [, amount]) => sum + amount, 0);

  // --- TAHAP 2: LABA RUGI ---
  const transactionLabaRugiWhere = {
    tenantId: auth.tenantId,
    ...(fromDate || toDate ? { date: dateFilter } : {}),
    ...(projectFilter ? { projectId: projectFilter } : {}),
  };

  const pendapatanPenjualanAgg = await prisma.transaction.aggregate({
    where: {
      ...transactionLabaRugiWhere,
      category: {
        in: [...PENDAPATAN_DIAKUI_CATEGORIES],
      },
      unit: {
        is: {
          tenantId: auth.tenantId,
          status: { in: ["LUNAS", "SERAH_TERIMA"] },
          ...(projectFilter ? { projectId: projectFilter } : {}),
        },
      },
    },
    _sum: { amount: true },
  });

  const bebanAgg = await prisma.transaction.groupBy({
    by: ["category"],
    where: {
      ...transactionLabaRugiWhere,
      category: {
        in: [...LABA_RUGI_BEBAN_CATEGORIES],
      },
    },
    _sum: { amount: true },
  });

  const getBeban = (category: string) =>
    Number(bebanAgg.find((item) => item.category === category)?._sum.amount || 0);

  const pendapatanPenjualan = Number(pendapatanPenjualanAgg._sum.amount || 0);
  const hpp = 0;
  const labaKotor = pendapatanPenjualan - hpp;

  const bebanKonstruksi = getBeban("BIAYA_KONSTRUKSI");
  const bebanMarketing = getBeban("BIAYA_MARKETING");
  const bebanGaji = getBeban("BIAYA_GAJI");
  const bebanOperasional = getBeban("BIAYA_OPERASIONAL");
  const bebanLainLain = getBeban("LAIN_LAIN");
  const pendapatanLainLain = 0;

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
  const piutangKPR = balances.get("1400") || 0;
  const persediaanUnit = balances.get("1500") || 0;

  const bdk = balances.get("1600") || 0;
  const tanah = balances.get("1700") || 0;
  const totalAset = sumByPrefix("1");

  const pendDiterimaDiMuka = balances.get("2100") || 0;
  const hutangKontraktor = balances.get("2200") || 0;
  const hutangUsaha = balances.get("2300") || 0;
  const hutangBank = balances.get("2400") || 0;
  const totalKewajiban = sumByPrefix("2");

  console.log(
    "[Laporan Neraca Debug] Kewajiban raw:",
    JSON.stringify(
      Array.from(balances.entries())
        .filter(([code]) => code.startsWith("2"))
        .map(([code, saldo]) => ({ code, saldo }))
    )
  );

  const modalDisetor = balances.get("3100") || 0;
  const labaDitahan = balances.get("3200") || 0;
  const labaBerjalan = sumByPrefix("4") - sumByPrefix("5");
  const totalEkuitas = modalDisetor + labaDitahan + labaBerjalan;

  const neracaData = {
    kas, bank, piutangPembeli, piutangKPR, persediaanUnit, bdk, tanah, totalAset,
    pendDiterimaDiMuka, hutangKontraktor, hutangUsaha, hutangBank, totalKewajiban,
    modalDisetor, labaDitahan, labaBersih: labaBerjalan, totalEkuitas
  };


  // --- TAHAP 4: ARUS KAS ---
  // Aggregate transactions mapping logic
  const txFilter = {
    tenantId: auth.tenantId,
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
    where: { tenantId: auth.tenantId },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
  const company = await prisma.companyProfile.findFirst({ where: { tenantId: auth.tenantId } });

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
