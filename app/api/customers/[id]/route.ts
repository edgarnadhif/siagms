import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ success: false, data: null, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: customer, message: "Berhasil mengambil data pelanggan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const customer = await prisma.customer.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: customer, message: "Berhasil update data pelanggan" });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, data: null, message: "NIK atau Data sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    // Soft delete
    const customer = await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: customer, message: "Berhasil menghapus pelanggan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
