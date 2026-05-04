import { NextResponse } from "next/server";
import { getTenantWhere, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const customer = await prisma.customer.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
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
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const body = await request.json();

    const current = await prisma.customer.findFirst({ where: getTenantWhere(auth.tenantId, { id }) });
    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, data: null, message: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    const phoneRegex = /^(\+628|08)\d{8,12}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { success: false, data: null, message: "Format nomor HP tidak valid (08xx atau +628xx, minimal 10 digit)" },
        { status: 400 }
      );
    }

    if (body.email && body.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ success: false, data: null, message: "Format email tidak valid" }, { status: 400 });
      }
    }

    if (current.paymentMethod === "KPR") {
      if (!body.kprAmount || parseFloat(body.kprAmount) <= 0) {
        return NextResponse.json({ success: false, data: null, message: "Plafon KPR harus diisi dan bernilai positif" }, { status: 400 });
      }
      if (!body.kprTenor || parseInt(body.kprTenor) <= 0 || parseInt(body.kprTenor) > 360) {
        return NextResponse.json({ success: false, data: null, message: "Tenor KPR harus antara 1-360 bulan" }, { status: 400 });
      }
    }

    // NIK and paymentMethod are immutable
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        address: body.address,
        ...(current.paymentMethod === "KPR" && {
          bankName: body.bankName || null,
          kprAccountNo: body.kprAccountNo || null,
          kprAmount: body.kprAmount ? parseFloat(body.kprAmount) : null,
          kprTenor: body.kprTenor ? parseInt(body.kprTenor) : null,
          kprAkadDate: body.kprAkadDate ? new Date(body.kprAkadDate) : null,
        }),
      },
      include: { unit: true },
    });

    return NextResponse.json({ success: true, data: customer, message: "Data pelanggan berhasil diperbarui" });
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const isNik = Array.isArray(target) ? target.includes('nik') : (typeof target === 'string' && target.includes('nik'));
      
      if (isNik) {
        return NextResponse.json({ success: false, data: null, message: "NIK sudah terdaftar di sistem" }, { status: 400 });
      }
      return NextResponse.json({ success: false, data: null, message: "Terjadi duplikasi data unik (Kode/NIK)" }, { status: 400 });
    }
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const body = await request.json();

    const action = body?.action as "activate" | "deactivate" | undefined;
    if (!action || !["activate", "deactivate"].includes(action)) {
      return NextResponse.json(
        { success: false, data: null, message: "Aksi tidak valid" },
        { status: 400 }
      );
    }

    const current = await prisma.customer.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: { unit: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    if (action === "deactivate" && current.unit) {
      return NextResponse.json(
        { success: false, data: null, message: "Pelanggan tidak dapat dinonaktifkan karena masih memiliki unit aktif" },
        { status: 403 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { isActive: action === "activate" },
    });

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: action === "activate"
        ? "Pelanggan berhasil diaktifkan kembali"
        : "Pelanggan berhasil dinonaktifkan",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(["ADMIN"]);
    const { id } = await context.params;

    const current = await prisma.customer.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
      include: { unit: true },
    });

    if (!current) {
      return NextResponse.json({ success: false, data: null, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    if (current.unit) {
      return NextResponse.json(
        { success: false, data: null, message: "Pelanggan tidak dapat dihapus karena masih memiliki unit aktif" },
        { status: 403 }
      );
    }

    const [transactionCount, serahTerimaCount, unitAkadCount] = await Promise.all([
      prisma.transaction.count({ where: { tenantId: auth.tenantId, customerId: id } }),
      prisma.serahTerima.count({ where: { tenantId: auth.tenantId, customerId: id } }),
      prisma.unitAkad.count({ where: { tenantId: auth.tenantId, customerId: id } }),
    ]);

    if (transactionCount > 0 || serahTerimaCount > 0 || unitAkadCount > 0) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Pelanggan tidak dapat dihapus karena masih memiliki riwayat transaksi/akad/serah terima",
        },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, data: customer, message: "Pelanggan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: null, message: error.message }, { status: 500 });
  }
}
