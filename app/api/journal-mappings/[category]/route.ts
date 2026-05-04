import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import {
  ensureDefaultJournalMappings,
  isJournalMappingCategory,
} from '@/lib/journal-mappings'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const auth = await requireAuth(['ADMIN'])
    const { category } = await params
    const body = await request.json()
    const { debitAccountId, creditAccountId, isActive } = body

    if (!isJournalMappingCategory(category)) {
      return NextResponse.json(
        { success: false, message: 'Kategori transaksi tidak dikenali' },
        { status: 400 }
      )
    }

    if (!debitAccountId || !creditAccountId) {
      return NextResponse.json(
        { success: false, message: 'Akun debit dan kredit wajib diisi' },
        { status: 400 }
      )
    }

    if (debitAccountId === creditAccountId) {
      return NextResponse.json(
        { success: false, message: 'Akun debit dan kredit tidak boleh sama' },
        { status: 400 }
      )
    }

    await ensureDefaultJournalMappings(prisma, auth.tenantId)

    // Validate both accounts exist and belong to this tenant
    const [debitAccount, creditAccount] = await Promise.all([
      prisma.account.findFirst({
        where: { id: debitAccountId, tenantId: auth.tenantId },
        select: { id: true, isActive: true },
      }),
      prisma.account.findFirst({
        where: { id: creditAccountId, tenantId: auth.tenantId },
        select: { id: true, isActive: true },
      }),
    ])

    if (!debitAccount) {
      return NextResponse.json(
        { success: false, message: 'Akun debit tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!creditAccount) {
      return NextResponse.json(
        { success: false, message: 'Akun kredit tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!debitAccount.isActive || !creditAccount.isActive) {
      return NextResponse.json(
        { success: false, message: 'Akun debit dan kredit harus berstatus aktif' },
        { status: 400 }
      )
    }

    // Update the mapping
    const mapping = await prisma.journalMapping.update({
      where: {
        tenantId_category: {
          tenantId: auth.tenantId,
          category,
        },
      },
      data: {
        debitAccountId,
        creditAccountId,
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
      },
      include: {
        debitAccount: {
          select: { id: true, code: true, name: true },
        },
        creditAccount: {
          select: { id: true, code: true, name: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: `Mapping jurnal kategori ${mapping.description} berhasil diperbarui`,
      data: mapping,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui journal mapping'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
