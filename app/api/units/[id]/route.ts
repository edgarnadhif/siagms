import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const EDITABLE_STATUSES = ["TERSEDIA", "BOOKING"];
const DELETABLE_STATUSES = ["TERSEDIA"];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const unit = await prisma.unit.findUnique({
      where: { id },
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

    return NextResponse.json({ success: true, data: unit, message: "Berhasil mengambil data unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Get current unit to validate status
    const current = await prisma.unit.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (!EDITABLE_STATUSES.includes(current.status)) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit tidak dapat diedit karena sudah dalam proses transaksi" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.blockName || !body.unitNumber) {
      return NextResponse.json({ success: false, data: null, message: "Blok dan nomor unit wajib diisi" }, { status: 400 });
    }
    if (parseFloat(body.landArea) <= 0 || parseFloat(body.buildingArea) <= 0 || parseFloat(body.price) <= 0) {
      return NextResponse.json({ success: false, data: null, message: "Luas dan harga harus bernilai positif" }, { status: 400 });
    }

    // Check for duplicate blok+nomor unit (excluding self)
    const newCode = `UNIT-${body.blockName}${body.unitNumber}`;
    const duplicate = await prisma.unit.findFirst({
      where: {
        blockName: body.blockName,
        unitNumber: body.unitNumber,
        id: { not: id },
        isActive: true,
      },
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, data: null, message: "Kombinasi blok dan nomor unit sudah digunakan oleh unit lain" },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        blockName: body.blockName,
        unitNumber: body.unitNumber,
        type: body.type,
        landArea: parseFloat(body.landArea),
        buildingArea: parseFloat(body.buildingArea),
        price: parseFloat(body.price),
        projectId: body.projectId,
        unitCode: newCode,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      },
    });

    return NextResponse.json({ success: true, data: unit, message: "Data unit berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const current = await prisma.unit.findUnique({
      where: { id },
      include: { transactions: { take: 1 } },
    });

    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Unit tidak ditemukan" }, { status: 404 });
    }

    if (current.transactions.length > 0) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit tidak dapat dihapus karena sudah memiliki riwayat transaksi" },
        { status: 403 }
      );
    }

    if (!DELETABLE_STATUSES.includes(current.status)) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit hanya dapat dihapus jika berstatus TERSEDIA" },
        { status: 403 }
      );
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: unit, message: "Data unit berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
