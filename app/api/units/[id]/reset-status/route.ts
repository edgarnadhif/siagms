import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(["ADMIN", "AKUNTAN"]);
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (status !== "LUNAS") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Status reset yang diizinkan hanya "LUNAS"',
        },
        { status: 400 }
      );
    }

    const unit = await prisma.unit.findFirst({
      where: {
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!unit) {
      return NextResponse.json(
        { success: false, data: null, message: "Unit tidak ditemukan" },
        { status: 404 }
      );
    }

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: { status: "LUNAS" },
      include: {
        project: { select: { id: true, name: true, code: true } },
        customer: true,
      },
    });

    revalidatePath("/dashboard/unit");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      data: updatedUnit,
      message: "Status unit berhasil direset ke LUNAS",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, message: error.message },
      { status: 500 }
    );
  }
}
