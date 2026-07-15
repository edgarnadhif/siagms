import { NextResponse } from "next/server";
import { getErrorStatus, getTenantWhere, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const units = await prisma.unit.findMany({
      where: getTenantWhere(auth.tenantId, {
        isActive: true,
        ...(status && status !== "SEMUA" ? { status: status as any } : {}),
        ...(projectId && projectId !== "SEMUA" ? { projectId } : {}),
      }),
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      },
      orderBy: [{ blockName: "asc" }, { unitNumber: "asc" }],
    });

    return NextResponse.json({ success: true, data: units, message: "Berhasil mengambil data unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: getErrorStatus(error) });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const body = await request.json();
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

    let newCode = `UNIT-${blockName.trim()}${unitNumber.trim()}`;

    const exists = await prisma.unit.findFirst({
      where: getTenantWhere(auth.tenantId, { unitCode: newCode }),
    });
    if (exists) {
      if (exists.isActive) {
        return NextResponse.json({ success: false, data: null, message: "Unit dengan kode ini sudah ada" }, { status: 400 });
      } else {
        newCode = `${newCode}-${Date.now().toString().slice(-4)}`; // append suffix if recreating a soft-deleted unit code
      }
    }

    const unit = await prisma.unit.create({
      data: {
        tenantId: auth.tenantId,
        unitCode: newCode,
        blockName: blockName.trim(),
        unitNumber: unitNumber.trim(),
        type: type.trim(),
        landArea: numericLandArea,
        buildingArea: numericBuildingArea,
        price: numericPrice,
        projectId: project.id,
      },
    });

    return NextResponse.json({ success: true, data: unit, message: "Berhasil menambah unit" }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, data: null, message: "Kode unit sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: getErrorStatus(error) });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });
    }

    // Only allow deleting units with status TERSEDIA and no transactions
    const units = await prisma.unit.findMany({
      where: {
        id: { in: ids },
        tenantId: auth.tenantId,
      },
      include: {
        transactions: { take: 1 },
      },
    });

    const cannotDeleteStatus = units.filter((u) => u.status !== "TERSEDIA");
    const cannotDeleteTrans = units.filter((u) => u.transactions.length > 0);

    if (cannotDeleteStatus.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${cannotDeleteStatus.length} unit tidak dapat dihapus karena sudah dalam proses transaksi (Booking/Akad/Lunas)`,
        },
        { status: 403 }
      );
    }

    if (cannotDeleteTrans.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `${cannotDeleteTrans.length} unit tidak dapat dihapus karena memiliki riwayat transaksi`,
        },
        { status: 403 }
      );
    }

    const result = await prisma.unit.deleteMany({
      where: {
        id: { in: ids },
        tenantId: auth.tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} unit berhasil dihapus secara permanen`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: getErrorStatus(error) });
  }
}
