import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethod = searchParams.get("paymentMethod");

    const customers = await prisma.customer.findMany({
      where: {
        isActive: true,
        ...(paymentMethod && paymentMethod !== "SEMUA" ? { paymentMethod: paymentMethod as any } : {}),
      },
      include: {
        unit: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: customers, message: "Berhasil mengambil data pelanggan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Auto-generate customerCode
    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { customerCode: "desc" },
    });

    let newCode = "CUS-001";
    if (lastCustomer && lastCustomer.customerCode.startsWith("CUS-")) {
      const lastNumber = parseInt(lastCustomer.customerCode.split("-")[1], 10);
      newCode = `CUS-${String(lastNumber + 1).padStart(3, "0")}`;
    }

    const customer = await prisma.customer.create({
      data: {
        ...body,
        customerCode: newCode,
      },
    });

    return NextResponse.json({ success: true, data: customer, message: "Berhasil menambah pelanggan" }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, data: null, message: "NIK sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
