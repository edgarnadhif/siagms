import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const unit = await prisma.unit.update({
      where: { id },
      data: body,
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      }
    });

    return NextResponse.json({ success: true, data: unit, message: "Berhasil update data unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Soft delete
    const unit = await prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: unit, message: "Berhasil menghapus unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
