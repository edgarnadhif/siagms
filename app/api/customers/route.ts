import { NextResponse } from "next/server";
import { getTenantWhere, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { searchParams } = new URL(request.url);
    const paymentMethod = searchParams.get("paymentMethod");

    const customers = await prisma.customer.findMany({
      where: getTenantWhere(auth.tenantId, {
        isActive: true,
        ...(paymentMethod && paymentMethod !== "SEMUA" ? { paymentMethod: paymentMethod as any } : {}),
      }),
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
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const body = await request.json();

    // Auto-generate customerCode
    const existingCustomers = await prisma.customer.findMany({
      where: { tenantId: auth.tenantId },
      select: { customerCode: true },
    });

    let maxNumber = 0;
    for (const c of existingCustomers) {
      if (c.customerCode.startsWith("CUS-")) {
        const num = parseInt(c.customerCode.split("-")[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }
    const newCode = `CUS-${String(maxNumber + 1).padStart(3, "0")}`;

    const customer = await prisma.customer.create({
      data: {
        ...body,
        tenantId: auth.tenantId,
        customerCode: newCode,
      },
    });

    return NextResponse.json({ success: true, data: customer, message: "Berhasil menambah pelanggan" }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const isNik = Array.isArray(target) ? target.includes('nik') : (typeof target === 'string' && target.includes('nik'));
      
      if (isNik) {
        return NextResponse.json({ success: false, data: null, message: "NIK sudah terdaftar di sistem" }, { status: 400 });
      }
      return NextResponse.json({ success: false, data: null, message: "Terjadi duplikasi kode pelanggan, silakan coba lagi" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
