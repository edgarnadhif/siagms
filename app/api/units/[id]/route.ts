import { NextResponse } from "next/server";
import { getErrorStatus, getTenantWhere, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const EDITABLE_STATUSES = ["TERSEDIA", "BOOKING"];
const DELETABLE_STATUSES = ["TERSEDIA"];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const unit = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
        akadRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        transactions: {
          where: { status_pengakuan: { not: "dibatalkan" } },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    // Filter transactions to only belong to the current customer
    if (unit.customerId) {
      unit.transactions = unit.transactions.filter(
        (t) => t.customerId === unit.customerId
      );
    } else {
      unit.transactions = [];
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
    } catch {
      // Table may not exist yet or field mismatch — ignore
    }

    return NextResponse.json({ 
      success: true, 
      data: { ...unit, cancellations }, 
      message: "Berhasil mengambil data unit" 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: getErrorStatus(error) });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
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
    if (!blockName?.trim() || !unitNumber?.trim() || !type?.trim() || !projectId) {
      return NextResponse.json(
        { success: false, data: null, message: "Data unit dan proyek wajib diisi" },
        { status: 400 },
      );
    }

    const numericLandArea = Number(landArea);
    const numericBuildingArea = Number(buildingArea);
    const numericPrice = Number(price);
    if (numericLandArea <= 0 || numericBuildingArea <= 0 || numericPrice <= 0) {
      return NextResponse.json(
        { success: false, data: null, message: "Luas dan harga harus bernilai positif" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId: auth.tenantId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { success: false, data: null, message: "Proyek tidak ditemukan atau bukan milik tenant ini" },
        { status: 404 },
      );
    }

    const unitCode = `UNIT-${blockName.trim()}${unitNumber.trim()}`;

    const existing = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { unitCode, NOT: { id } }),
    });
    if (existing) {
      return NextResponse.json({ success: false, data: null, message: "Nomor unit sudah terpakai di proyek ini" }, { status: 400 });
    }

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        blockName: blockName.trim(),
        unitNumber: unitNumber.trim(),
        unitCode,
        type: type.trim(),
        landArea: numericLandArea,
        buildingArea: numericBuildingArea,
        price: numericPrice,
        projectId: project.id,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      }
    });

    return NextResponse.json({ success: true, data: updated, message: "Data unit diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: getErrorStatus(error) });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
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

    await prisma.unit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, data: null, message: "Unit berhasil dihapus permanen" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: getErrorStatus(error) });
  }
}
