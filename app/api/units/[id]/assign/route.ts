import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ success: false, data: null, message: "Customer ID harus diisi" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.findUnique({ where: { id } });
      if (!unit) {
        throw new Error("Unit tidak ditemukan");
      }

      if (unit.status !== 'TERSEDIA' && unit.status !== 'BOOKING') {
        throw new Error(`Unit tidak bisa di assign karena statusnya ${unit.status}`);
      }

      if (unit.customerId && unit.customerId !== customerId) {
        throw new Error("Unit ini sudah dimiliki oleh pelanggan lain");
      }

      const customer = await tx.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        throw new Error("Pelanggan tidak ditemukan");
      }

      const newStatus = customer.paymentMethod === 'KPR' ? 'INDENT' : 'BOOKING';

      const updatedUnit = await tx.unit.update({
        where: { id },
        data: {
          customerId: customer.id,
          status: newStatus as any,
        },
        include: {
          customer: true,
          project: { select: { id: true, name: true, code: true } }
        }
      });

      return updatedUnit;
    });

    return NextResponse.json({ success: true, data: result, message: "Berhasil assign pelanggan ke unit" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 400 });
  }
}
