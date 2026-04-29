import type { Prisma } from "@prisma/client";

type DbClient = Prisma.TransactionClient;

type AccountTemplate = {
  code: string;
  name: string;
  type: "ASET" | "KEWAJIBAN" | "EKUITAS" | "PENDAPATAN" | "BEBAN";
  normalBalance: "DEBIT" | "KREDIT";
};

export const DEFAULT_JOURNAL_ACCOUNTS: Record<string, AccountTemplate> = {
  "1200": {
    code: "1200",
    name: "Bank",
    type: "ASET",
    normalBalance: "DEBIT",
  },
  "2100": {
    code: "2100",
    name: "Pendapatan Diterima di Muka",
    type: "KEWAJIBAN",
    normalBalance: "KREDIT",
  },
  "4100": {
    code: "4100",
    name: "Pendapatan Penjualan Unit",
    type: "PENDAPATAN",
    normalBalance: "KREDIT",
  },
  "5200": {
    code: "5200",
    name: "Beban Konstruksi",
    type: "BEBAN",
    normalBalance: "DEBIT",
  },
  "5300": {
    code: "5300",
    name: "Beban Marketing & Penjualan",
    type: "BEBAN",
    normalBalance: "DEBIT",
  },
  "5400": {
    code: "5400",
    name: "Beban Gaji & Upah",
    type: "BEBAN",
    normalBalance: "DEBIT",
  },
  "5500": {
    code: "5500",
    name: "Beban Operasional Kantor",
    type: "BEBAN",
    normalBalance: "DEBIT",
  },
  "5600": {
    code: "5600",
    name: "Beban Lain-lain",
    type: "BEBAN",
    normalBalance: "DEBIT",
  },
};

export const DEFAULT_JOURNAL_MAPPINGS = [
  {
    category: "BOOKING_FEE",
    description: "Booking Fee",
    debitCode: "1200",
    creditCode: "2100",
  },
  {
    category: "DOWN_PAYMENT",
    description: "Down Payment",
    debitCode: "1200",
    creditCode: "2100",
  },
  {
    category: "ANGSURAN_KPR",
    description: "Angsuran KPR",
    debitCode: "1200",
    creditCode: "2100",
  },
  {
    category: "PENCAIRAN_KPR",
    description: "Pencairan KPR",
    debitCode: "1200",
    creditCode: "2100",
  },
  {
    category: "PELUNASAN_CASH",
    description: "Pelunasan Cash",
    debitCode: "1200",
    creditCode: "2100",
  },
  {
    category: "BIAYA_KONSTRUKSI",
    description: "Biaya Konstruksi",
    debitCode: "5200",
    creditCode: "1200",
  },
  {
    category: "BIAYA_MARKETING",
    description: "Biaya Marketing",
    debitCode: "5300",
    creditCode: "1200",
  },
  {
    category: "BIAYA_GAJI",
    description: "Biaya Gaji",
    debitCode: "5400",
    creditCode: "1200",
  },
  {
    category: "BIAYA_OPERASIONAL",
    description: "Biaya Operasional",
    debitCode: "5500",
    creditCode: "1200",
  },
  {
    category: "LAIN_LAIN",
    description: "Lain-lain",
    debitCode: "5600",
    creditCode: "1200",
  },
] as const;

export type JournalMappingCategory =
  (typeof DEFAULT_JOURNAL_MAPPINGS)[number]["category"];

export function isJournalMappingCategory(
  category: string,
): category is JournalMappingCategory {
  return DEFAULT_JOURNAL_MAPPINGS.some((item) => item.category === category);
}

async function ensureDefaultAccount(
  db: DbClient,
  tenantId: string,
  code: string,
) {
  const template = DEFAULT_JOURNAL_ACCOUNTS[code];

  if (!template) {
    throw new Error(`Template akun ${code} belum tersedia`);
  }

  const existing = await db.account.findFirst({
    where: { tenantId, code },
  });

  if (existing) return existing;

  return db.account.create({
    data: {
      tenantId,
      code: template.code,
      name: template.name,
      type: template.type,
      normalBalance: template.normalBalance,
      isActive: true,
      isSystem: true,
    },
  });
}

async function getDefaultAccountIds(db: DbClient, tenantId: string) {
  const codes = new Set<string>();

  DEFAULT_JOURNAL_MAPPINGS.forEach((mapping) => {
    codes.add(mapping.debitCode);
    codes.add(mapping.creditCode);
  });

  const accounts = new Map<string, { id: string }>();

  for (const code of codes) {
    const account = await ensureDefaultAccount(db, tenantId, code);
    accounts.set(code, { id: account.id });
  }

  return accounts;
}

export async function ensureDefaultJournalMappings(
  db: DbClient,
  tenantId: string,
) {
  const accounts = await getDefaultAccountIds(db, tenantId);

  for (const mapping of DEFAULT_JOURNAL_MAPPINGS) {
    const debitAccount = accounts.get(mapping.debitCode);
    const creditAccount = accounts.get(mapping.creditCode);

    if (!debitAccount || !creditAccount) {
      throw new Error(`Akun default untuk ${mapping.description} belum lengkap`);
    }

    await db.journalMapping.upsert({
      where: {
        tenantId_category: {
          tenantId,
          category: mapping.category,
        },
      },
      update: {
        description: mapping.description,
      },
      create: {
        tenantId,
        category: mapping.category,
        description: mapping.description,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        isActive: true,
      },
    });
  }
}

export async function resetDefaultJournalMappings(
  db: DbClient,
  tenantId: string,
) {
  const accounts = await getDefaultAccountIds(db, tenantId);

  for (const mapping of DEFAULT_JOURNAL_MAPPINGS) {
    const debitAccount = accounts.get(mapping.debitCode);
    const creditAccount = accounts.get(mapping.creditCode);

    if (!debitAccount || !creditAccount) {
      throw new Error(`Akun default untuk ${mapping.description} belum lengkap`);
    }

    await db.journalMapping.upsert({
      where: {
        tenantId_category: {
          tenantId,
          category: mapping.category,
        },
      },
      update: {
        description: mapping.description,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        isActive: true,
      },
      create: {
        tenantId,
        category: mapping.category,
        description: mapping.description,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        isActive: true,
      },
    });
  }
}
