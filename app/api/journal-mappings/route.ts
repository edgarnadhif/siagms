import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])

    const mappings = await prisma.journalMapping.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        debitAccount: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        creditAccount: {
          select: { id: true, code: true, name: true, isActive: true },
        },
      },
      orderBy: { category: 'asc' },
    })

    // Serialize dates to ISO strings
    const serialized = mappings.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data journal mapping'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
