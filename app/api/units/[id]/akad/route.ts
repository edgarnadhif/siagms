import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantWhere, requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const body = await request.json();

    const tanggalAkad = body.tanggalAkad ? new Date(body.tanggalAkad) : null;
    const nomorAkad = typeof body.nomorAkad === "string" ? body.nomorAkad.trim() : "";
    const namaBank = typeof body.namaBank === "string" ? body.namaBank.trim() : "";
    const catatan = typeof body.catatan === "string" ? body.catatan.trim() : "";
    const nilaiKPR = Number(body.nilaiKPR);

    if (!tanggalAkad || Number.isNaN(tanggalAkad.getTime()) || !nomorAkad || !namaBank || !nilaiKPR || nilaiKPR <= 0) {
      return NextResponse.json(
        { success: false, data: null, message: "Data akad belum lengkap atau tidak valid" },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: { customer: true },
    });

    if (!unit) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (unit.status !== "INDENT") {
      return NextResponse.json(
        { success: false, data: null, message: "Akad hanya bisa diproses untuk unit berstatus INDENT" },
        { status: 400 }
      );
    }

    if (!unit.customerId || !unit.customer) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit belum memiliki pelanggan aktif" },
        { status: 400 }
      );
    }

    const existingAkad = await prisma.unitAkad.findFirst({
      where: getTenantWhere(auth.tenantId, { unitId: id }),
      select: { id: true },
    });

    if (existingAkad) {
      return NextResponse.json(
        { success: false, data: null, message: "Data akad untuk unit ini sudah tercatat" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const akad = await tx.unitAkad.create({
        data: {
          tenantId: auth.tenantId,
          unitId: unit.id,
          customerId: unit.customerId!,
          tanggalAkad,
          namaBank,
          nomorAkad,
          nilaiKPR,
          catatan: catatan || null,
        },
      });

      await tx.unit.update({
        where: { id: unit.id },
        data: { status: "AKAD" },
      });

      return akad;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Akad berhasil dicatat. Unit siap untuk proses pencairan KPR.",
    });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { success: false, data: null, message: "Nomor akad sudah digunakan" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, data: null, message: error instanceof Error ? error.message : "Terjadi kesalahan sistem" },
      { status: 500 }
    );
  }
}
