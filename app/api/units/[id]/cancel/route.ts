import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const CANCELLABLE_STATUSES = ["BOOKING", "INDENT"];

// Ensure critical accounts exist (mirrors helper in actions.ts)
async function ensureAccountByCode(
  tenantId: string,
  code: string,
  name: string,
  type: string,
  normalBalance: string,
) {
  let acc = await prisma.account.findFirst({
    where: {
      tenantId,
      OR: [{ code }, { name: { contains: name, mode: "insensitive" } }],
    },
  });
  if (!acc) {
    acc = await prisma.account.create({
      data: { tenantId, code, name, type: type as any, normalBalance: normalBalance as any, isActive: true },
    });
  }
  return acc;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id: unitId } = await context.params;
    const body = await request.json();

    const { alasan, tanggalBatal } = body as {
      alasan: string;
      tanggalBatal: string;
    };

    // ── Validasi input ──────────────────────────────────────────────────
    if (!alasan || alasan.trim().length < 10) {
      return NextResponse.json(
        { success: false, data: null, message: "Alasan pembatalan wajib diisi minimal 10 karakter" },
        { status: 400 }
      );
    }

    const cancelDate = tanggalBatal ? new Date(tanggalBatal) : new Date();

    // ── Fetch unit + transaksi BF ──────────────────────────────────────
    const p = prisma as any;
    if (!p.cancellation) {
      return NextResponse.json(
        { success: false, data: null, message: "Database belum terupdate. Silakan jalankan npx prisma db push terlebih dahulu." },
        { status: 500 }
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        customer: true,
        transactions: {
          where: { category: "BOOKING_FEE", tenantId: auth.tenantId },
        },
      },
    });

    if (!unit || unit.tenantId !== auth.tenantId) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!CANCELLABLE_STATUSES.includes(unit.status)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: `Unit tidak dapat dibatalkan. Status saat ini: ${unit.status}. Pembatalan hanya bisa dilakukan pada status BOOKING atau INDENT.`,
        },
        { status: 403 }
      );
    }

    if (!unit.customer) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit belum memiliki pelanggan yang di-assign" },
        { status: 400 }
      );
    }

    // Total Booking Fee yang sudah masuk
    const totalBF = unit.transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // ── Prisma Transaction ──────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ensure accounts exist
      //    Debit  2100 Pendapatan Diterima di Muka
      //    Kredit 4200 Pendapatan Lain-lain
      const accPendapatanMuka = await ensureAccountByCode(
        auth.tenantId,
        "2100",
        "Pendapatan Diterima di Muka",
        "KEWAJIBAN",
        "KREDIT"
      );
      const accPendapatanLain = await ensureAccountByCode(
        auth.tenantId,
        "4200",
        "Pendapatan Lain-lain",
        "PENDAPATAN",
        "KREDIT"
      );

      // 2. Buat jurnal pembatalan (hanya jika ada BF yang masuk)
      let journalRef: string | null = null;
      if (totalBF > 0) {
        journalRef = `BATAL-${unit.unitCode}-${Date.now().toString().slice(-6)}`;
        const journalDesc = `Pembatalan pembelian - ${unit.customer!.name} - ${unit.unitCode} - BF hangus`;

        await tx.journalEntry.createMany({
          data: [
            {
              tenantId: auth.tenantId,
              reference: journalRef,
              date: cancelDate,
              description: journalDesc,
              accountId: accPendapatanMuka.id,
              debit: totalBF,
              credit: 0,
              unitId: unitId,
              isAuto: true,
            },
            {
              tenantId: auth.tenantId,
              reference: journalRef,
              date: cancelDate,
              description: journalDesc,
              accountId: accPendapatanLain.id,
              debit: 0,
              credit: totalBF,
              unitId: unitId,
              isAuto: true,
            },
          ],
        });
      }

      // 3. Catat di tabel Cancellation
      const cancellation = await tx.cancellation.create({
        data: {
          tenantId: auth.tenantId,
          unitId,
          customerId: unit.customer!.id,
          customerName: unit.customer!.name,
          customerCode: unit.customer!.customerCode,
          tanggalBatal: cancelDate,
          alasan: alasan.trim(),
          totalBFHangus: totalBF,
        },
      });

      // 4. Update unit: status → TERSEDIA, customerId → null
      const updatedUnit = await tx.unit.update({
        where: { id: unitId },
        data: {
          status: "TERSEDIA",
          customerId: null,
        },
      });

      return { cancellation, updatedUnit, journalRef, totalBF };
    });

    // Revalidate pages
    revalidatePath("/dashboard/unit");
    revalidatePath("/dashboard/pelanggan");
    revalidatePath("/dashboard/jurnal-umum");
    revalidatePath("/dashboard/buku-besar");
    revalidatePath("/dashboard");

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Pembelian berhasil dibatalkan. Booking Fee Rp ${new Intl.NumberFormat("id-ID").format(result.totalBF)} dicatat sebagai pendapatan lain-lain`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: "Terjadi kesalahan: " + error.message },
      { status: 500 }
    );
  }
}
