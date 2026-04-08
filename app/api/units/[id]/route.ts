import { NextResponse } from "next/server";
import { getTenantWhere, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const EDITABLE_STATUSES = ["TERSEDIA", "BOOKING"];
const DELETABLE_STATUSES = ["TERSEDIA"];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
    const { id } = await context.params;
    const unit = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
        transactions: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    // Fetch cancellations separately — gracefully handles case where table doesn't exist yet
    let cancellations: any[] = [];
    try {
      const p = prisma as any;
      if (p.cancellation) {
        cancellations = await p.cancellation.findMany({
          where: getTenantWhere(auth.tenantId, { unitId: id }),
          orderBy: { tanggalBatal: "desc" },
        });
      }
    } catch (e) {
      // Table may not exist yet or field mismatch — ignore
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...unit, cancellations }, 
      message: "Berhasil mengambil data unit" 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
    const { id } = await context.params;
    const body = await request.json();

    const current = await prisma.unit.findFirst({ where: getTenantWhere(auth.tenantId, { id }) });
    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (!EDITABLE_STATUSES.includes(current.status)) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit tidak dapat diedit karena sudah dalam proses transaksi" },
        { status: 403 }
      );
    }

    const { blockName, unitNumber, type, landArea, buildingArea, price, projectId } = body;
    const unitCode = `${blockName}/${unitNumber}`;

    const existing = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { unitCode, projectId, NOT: { id } }),
    });
    if (existing) {
      return NextResponse.json({ success: false, data: null, message: "Nomor unit sudah terpakai di proyek ini" }, { status: 400 });
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        blockName,
        unitNumber,
        unitCode,
        type,
        landArea: landArea ? parseFloat(landArea) : undefined,
        buildingArea: buildingArea ? parseFloat(buildingArea) : undefined,
        price: price ? parseFloat(price) : undefined,
        projectId,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      }
    });

    return NextResponse.json({ success: true, data: updated, message: "Data unit diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["SUPER_ADMIN", "AKUNTAN", "MARKETING"]);
    const { id } = await context.params;

    const unit = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: { transactions: true }
    });

    if (!unit) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (!DELETABLE_STATUSES.includes(unit.status)) {
      return NextResponse.json({ success: false, data: null, message: "Hanya unit berstatus TERSEDIA yang dapat dihapus" }, { status: 403 });
    }

    if (unit.transactions.length > 0) {
      return NextResponse.json({ success: false, data: null, message: "Unit memiliki riwayat transaksi" }, { status: 403 });
    }

    await prisma.unit.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, data: null, message: "Unit berhasil dinonaktifkan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
