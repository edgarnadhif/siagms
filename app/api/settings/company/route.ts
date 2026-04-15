import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import {
  getCompanySettingsByTenantId,
  upsertCompanySettingsByTenantId,
} from "@/lib/company-settings";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan sistem";
}

export async function GET() {
  try {
    const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN"]);
    const settings = await getCompanySettingsByTenantId(auth.tenantId);

    return NextResponse.json(settings);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(["SUPER_ADMIN"]);
    const body = (await request.json()) as {
      companyName?: string;
      companyAddress?: string;
      companyPhone?: string;
      companyEmail?: string;
      logoUrl?: string;
    };

    if (!body.companyName?.trim()) {
      return NextResponse.json(
        { message: "Nama perusahaan wajib diisi" },
        { status: 400 },
      );
    }

    const settings = await upsertCompanySettingsByTenantId(auth.tenantId, {
      companyName: body.companyName,
      companyAddress: body.companyAddress,
      companyPhone: body.companyPhone,
      companyEmail: body.companyEmail,
      logoUrl: body.logoUrl,
    });

    return NextResponse.json(settings);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
