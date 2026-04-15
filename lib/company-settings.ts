import "server-only";

import { prisma } from "@/lib/db";

export type CompanySettingsRecord = {
  id: string;
  tenantId: string;
  companyName: string;
  companyAddress: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  logoUrl: string | null;
  updatedAt: Date;
};

export type CompanySettingsPayload = {
  companyName: string;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  logoUrl?: string | null;
};

const DEFAULT_COMPANY_SETTINGS = {
  companyName: "Nama Perusahaan",
  companyAddress: null,
  companyPhone: null,
  companyEmail: null,
  logoUrl: null,
} as const;

function normalizeOptionalText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getDefaultCompanySettings() {
  return { ...DEFAULT_COMPANY_SETTINGS };
}

export async function getCompanySettingsByTenantId(
  tenantId: string,
): Promise<CompanySettingsRecord> {
  const settings = await prisma.companySettings.findUnique({
    where: { tenantId },
  });

  if (settings) {
    return settings;
  }

  const companyProfile = await prisma.companyProfile.findUnique({
    where: { tenantId },
  });

  return {
    id: `${tenantId}-company-settings`,
    tenantId,
    companyName:
      companyProfile?.name?.trim() || DEFAULT_COMPANY_SETTINGS.companyName,
    companyAddress: normalizeOptionalText(companyProfile?.address),
    companyPhone: normalizeOptionalText(companyProfile?.phone),
    companyEmail: normalizeOptionalText(companyProfile?.email),
    logoUrl: normalizeOptionalText(companyProfile?.logoUrl),
    updatedAt: companyProfile?.updatedAt ?? new Date(0),
  };
}

export async function upsertCompanySettingsByTenantId(
  tenantId: string,
  payload: CompanySettingsPayload,
) {
  const normalizedData = {
    companyName: payload.companyName.trim(),
    companyAddress: normalizeOptionalText(payload.companyAddress),
    companyPhone: normalizeOptionalText(payload.companyPhone),
    companyEmail: normalizeOptionalText(payload.companyEmail),
    logoUrl: normalizeOptionalText(payload.logoUrl),
  };

  return prisma.$transaction(async (tx) => {
    const settings = await tx.companySettings.upsert({
      where: { tenantId },
      update: normalizedData,
      create: {
        tenantId,
        ...normalizedData,
      },
    });

    const existingProfile = await tx.companyProfile.findUnique({
      where: { tenantId },
      select: { id: true },
    });

    if (existingProfile) {
      await tx.companyProfile.update({
        where: { id: existingProfile.id },
        data: {
          name: normalizedData.companyName,
          address: normalizedData.companyAddress,
          phone: normalizedData.companyPhone,
          email: normalizedData.companyEmail,
          logoUrl: normalizedData.logoUrl,
        },
      });
    } else {
      await tx.companyProfile.create({
        data: {
          tenantId,
          name: normalizedData.companyName,
          address: normalizedData.companyAddress,
          phone: normalizedData.companyPhone,
          email: normalizedData.companyEmail,
          logoUrl: normalizedData.logoUrl,
        },
      });
    }

    return settings;
  });
}
