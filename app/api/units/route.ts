import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const projectId = searchParams.get("projectId");

    const units = await prisma.unit.findMany({
      where: {
        isActive: true,
        ...(status && status !== "SEMUA" ? { status: status as any } : {}),
        ...(projectId && projectId !== "SEMUA" ? { projectId } : {}),
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      },
      orderBy: [{ blockName: "asc" }, { unitNumber: "asc" }],
    });

    return NextResponse.json({ success: true, data: units, message: "Berhasil mengambil data unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let newCode = `UNIT-${body.blockName}${body.unitNumber}`;

    const exists = await prisma.unit.findUnique({ where: { unitCode: newCode } });
    if (exists) {
      if (exists.isActive) {
        return NextResponse.json({ success: false, data: null, message: "Unit dengan kode ini sudah ada" }, { status: 400 });
      } else {
        newCode = `${newCode}-${Date.now().toString().slice(-4)}`; // append suffix if recreating a soft-deleted unit code
      }
    }

    const unit = await prisma.unit.create({
      data: {
        ...body,
        unitCode: newCode,
      },
    });

    return NextResponse.json({ success: true, data: unit, message: "Berhasil menambah unit" }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, data: null, message: "Kode unit sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
