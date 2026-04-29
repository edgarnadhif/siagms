import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  ensureDefaultJournalMappings,
  resetDefaultJournalMappings,
} from '@/lib/journal-mappings'

export async function GET() {
  try {
    const auth = await requireAuth(['ADMIN', 'AKUNTAN'])

    await ensureDefaultJournalMappings(prisma, auth.tenantId)

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

export async function POST() {
  try {
    const auth = await requireAuth(['ADMIN'])

    await resetDefaultJournalMappings(prisma, auth.tenantId)

    return NextResponse.json({
      success: true,
      message: 'Konfigurasi jurnal otomatis berhasil dikembalikan ke default',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mereset journal mapping'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
