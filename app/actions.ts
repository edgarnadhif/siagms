'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { getTenantWhere, requireAuth } from '@/lib/auth'
import {
  getCompanySettingsByTenantId,
  upsertCompanySettingsByTenantId,
} from '@/lib/company-settings'

function slugifyTenantName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type DbClient = Prisma.TransactionClient | typeof prisma

const REVENUE_PROJECT_CATEGORIES = ['BOOKING_FEE', 'DOWN_PAYMENT', 'PENCAIRAN_KPR', 'PELUNASAN_CASH'] as const
const UNIT_REQUIRED_CATEGORIES = ['BOOKING_FEE', 'DOWN_PAYMENT', 'PENCAIRAN_KPR', 'PELUNASAN_CASH'] as const
const EXPENSE_PROJECT_CATEGORIES = ['BIAYA_KONSTRUKSI', 'BIAYA_MARKETING', 'BIAYA_OPERASIONAL', 'BIAYA_GAJI', 'LAIN_LAIN'] as const

type UnitRevenueBreakdown = {
  bookingFee: number
  downPayment: number
  pencairanKpr: number
  pelunasanCash: number
  total: number
}

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

async function getUnitRevenueBreakdown(db: DbClient, tenantId: string, unitId: string): Promise<UnitRevenueBreakdown> {
  const totalPenerimaan = await db.transaction.aggregate({
    where: {
      tenantId,
      unitId,
      category: { in: [...REVENUE_PROJECT_CATEGORIES] }
    },
    _sum: { amount: true }
  })

  const grouped = await db.transaction.groupBy({
    by: ['category'],
    where: {
      tenantId,
      unitId,
      category: { in: [...REVENUE_PROJECT_CATEGORIES] }
    },
    _sum: { amount: true }
  })

  const amounts = {
    BOOKING_FEE: 0,
    DOWN_PAYMENT: 0,
    PENCAIRAN_KPR: 0,
    PELUNASAN_CASH: 0
  }

  grouped.forEach((item) => {
    const amount = Number(item._sum.amount ?? 0)

    switch (item.category) {
      case 'BOOKING_FEE':
        amounts.BOOKING_FEE = amount
        break
      case 'DOWN_PAYMENT':
        amounts.DOWN_PAYMENT = amount
        break
      case 'PENCAIRAN_KPR':
        amounts.PENCAIRAN_KPR = amount
        break
      case 'PELUNASAN_CASH':
        amounts.PELUNASAN_CASH = amount
        break
      default:
        break
    }
  })

  return {
    bookingFee: amounts.BOOKING_FEE,
    downPayment: amounts.DOWN_PAYMENT,
    pencairanKpr: amounts.PENCAIRAN_KPR,
    pelunasanCash: amounts.PELUNASAN_CASH,
    total: Number(totalPenerimaan._sum.amount ?? 0)
  }
}

function deriveUnitStatusFromRevenueCategories(categories: string[]) {
  if (categories.includes('PELUNASAN_CASH') || categories.includes('PENCAIRAN_KPR')) {
    return 'LUNAS'
  }

  if (categories.includes('DOWN_PAYMENT')) {
    return 'INDENT'
  }

  if (categories.includes('BOOKING_FEE')) {
    return 'BOOKING'
  }

  return 'TERSEDIA'
}

async function syncUnitStatusFromTransactions(db: DbClient, tenantId: string, unitId: string) {
  const unit = await db.unit.findFirst({
    where: { id: unitId, tenantId },
    select: { id: true, status: true },
  })

  if (!unit) return

  const revenueTransactions = await db.transaction.findMany({
    where: {
      tenantId,
      unitId,
      category: { in: [...REVENUE_PROJECT_CATEGORIES] },
    },
    select: { category: true },
  })

  const nextStatus = deriveUnitStatusFromRevenueCategories(
    revenueTransactions.map((item) => item.category),
  )

  // Preserve manually advanced statuses from akad/serah-terima workflow, unless it upgrades to LUNAS.
  if ((unit.status === 'AKAD' && nextStatus !== 'LUNAS') || unit.status === 'SERAH_TERIMA') {
    return
  }

  if (unit.status !== nextStatus) {
    await db.unit.update({
      where: { id: unitId },
      data: { status: nextStatus as any },
    })
  }
}

function parseCurrencyInput(value: string | null) {
  if (!value) return 0
  return parseFloat(value.replace(/[^\d.-]/g, ''))
}

export async function getCompanyProfile() {
  const auth = await requireAuth()
  const settings = await getCompanySettingsByTenantId(auth.tenantId)

  return {
    name: settings.companyName,
    logoUrl: settings.logoUrl ?? "",
    address: settings.companyAddress ?? "",
    phone: settings.companyPhone ?? "",
    email: settings.companyEmail ?? "",
  }
}

export async function updateCompanyProfile(_prevState: unknown, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const logoUrl = formData.get('logoUrl') as string // In real app, handle file upload

  await upsertCompanySettingsByTenantId(auth.tenantId, {
    companyName: name,
    companyAddress: address,
    companyPhone: phone,
    companyEmail: email,
    logoUrl,
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/laporan')
  revalidatePath('/dashboard/buku-besar')
  revalidatePath('/dashboard/neraca-saldo')
  
  return { message: 'Profile updated successfully' }
}

export async function register(prevState: any, formData: FormData) {
  const companyName = formData.get('companyName') as string
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!companyName || !fullName || !email || !password) {
    return { error: 'Nama perusahaan, nama owner, email, dan password wajib diisi' }
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
  })

  if (existingUser) {
    return { error: 'User already exists' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const baseSlug = slugifyTenantName(companyName)
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug: baseSlug },
  })
  const tenantSlug = existingTenant ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: companyName.trim(),
        slug: tenantSlug,
      },
    })

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        fullName: fullName.trim(),
        role: 'SUPER_ADMIN',
      },
    })

    await tx.companyProfile.create({
      data: {
        tenantId: tenant.id,
        name: companyName.trim(),
        email: email.trim().toLowerCase(),
      },
    })

    await tx.companySettings.create({
      data: {
        tenantId: tenant.id,
        companyName: companyName.trim(),
        companyEmail: email.trim().toLowerCase(),
      },
    })
  })

  // Redirect to login after successful registration
  redirect('/login')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}


export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const remember = formData.get('remember-me') === 'on'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const user = await prisma.user.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      isActive: true,
    },
  })

  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { isActive: true },
  })

  if (!tenant?.isActive) {
    return { error: 'Invalid credentials' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    return { error: 'Invalid credentials' }
  }

  await createSession(
    {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role as 'SUPER_ADMIN' | 'AKUNTAN' | 'MARKETING',
    },
    remember,
  )

  redirect('/dashboard')
}

const MANAGEABLE_ROLES = ['SUPER_ADMIN', 'AKUNTAN', 'MARKETING'] as const

function isManageableRole(role: string): role is typeof MANAGEABLE_ROLES[number] {
  return MANAGEABLE_ROLES.includes(role as typeof MANAGEABLE_ROLES[number])
}

async function countActiveSuperAdmins(tenantId: string) {
  return prisma.user.count({
    where: {
      tenantId,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })
}

export async function createTenantUser(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  const fullName = (formData.get('fullName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const role = formData.get('role') as string

  if (!email || !password || !role) {
    return { error: 'Nama, email, password, dan role wajib diisi' }
  }

  if (!isManageableRole(role)) {
    return { error: 'Role user tidak valid' }
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      tenantId: auth.tenantId,
      email,
    },
    select: { id: true },
  })

  if (existingUser) {
    return { error: 'Email sudah digunakan pada tenant ini' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      tenantId: auth.tenantId,
      fullName: fullName || null,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    },
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function updateTenantUser(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  const userIdRaw = formData.get('userId') as string
  const fullName = (formData.get('fullName') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  const userId = Number(userIdRaw)
  if (!userId || !email || !role) {
    return { error: 'Data user tidak lengkap' }
  }

  if (!isManageableRole(role)) {
    return { error: 'Role user tidak valid' }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: auth.tenantId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!targetUser) {
    return { error: 'User tidak ditemukan atau bukan milik tenant ini' }
  }

  if (targetUser.id === auth.id && role !== 'SUPER_ADMIN') {
    return { error: 'SUPER_ADMIN tidak dapat menurunkan role dirinya sendiri' }
  }

  if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const superAdminCount = await countActiveSuperAdmins(auth.tenantId)
    if (superAdminCount <= 1) {
      return { error: 'Tenant harus memiliki minimal satu SUPER_ADMIN aktif' }
    }
  }

  const emailOwner = await prisma.user.findFirst({
    where: {
      tenantId: auth.tenantId,
      email,
      NOT: { id: userId },
    },
    select: { id: true },
  })

  if (emailOwner) {
    return { error: 'Email sudah digunakan user lain di tenant ini' }
  }

  const data: {
    fullName: string | null
    email: string
    role: typeof MANAGEABLE_ROLES[number]
    password?: string
  } = {
    fullName: fullName || null,
    email,
    role,
  }

  if (password?.trim()) {
    data.password = await bcrypt.hash(password.trim(), 10)
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  })

  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deactivateTenantUser(userId: number) {
  const auth = await requireAuth(['SUPER_ADMIN'])

  if (!userId) {
    return { error: 'ID user tidak valid' }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: auth.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      role: true,
    },
  })

  if (!targetUser) {
    return { error: 'User tidak ditemukan atau sudah nonaktif' }
  }

  if (targetUser.id === auth.id) {
    return { error: 'Anda tidak dapat menghapus akun Anda sendiri' }
  }

  if (targetUser.role === 'SUPER_ADMIN') {
    const superAdminCount = await countActiveSuperAdmins(auth.tenantId)
    if (superAdminCount <= 1) {
      return { error: 'Tenant harus memiliki minimal satu SUPER_ADMIN aktif' }
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function activateTenantUser(userId: number) {
  const auth = await requireAuth(['SUPER_ADMIN'])

  if (!userId) {
    return { error: 'ID user tidak valid' }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: auth.tenantId,
      isActive: false,
    },
    select: {
      id: true,
    },
  })

  if (!targetUser) {
    return { error: 'User tidak ditemukan atau sudah aktif' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  })

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function permanentlyDeleteTenantUser(userId: number) {
  const auth = await requireAuth(['SUPER_ADMIN'])

  if (!userId) {
    return { error: 'ID user tidak valid' }
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: auth.tenantId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  })

  if (!targetUser) {
    return { error: 'User tidak ditemukan' }
  }

  if (targetUser.id === auth.id) {
    return { error: 'Anda tidak dapat menghapus akun Anda sendiri' }
  }

  if (targetUser.isActive) {
    return { error: 'Nonaktifkan user terlebih dahulu sebelum hapus permanen' }
  }

  if (targetUser.role === 'SUPER_ADMIN') {
    const superAdminCount = await countActiveSuperAdmins(auth.tenantId)
    if (superAdminCount <= 1) {
      return { error: 'Tenant harus memiliki minimal satu SUPER_ADMIN aktif' }
    }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })
  } catch (err: any) {
    if (err?.code === 'P2003' || err?.code === 'P2014') {
      return { error: 'User tidak bisa dihapus karena masih dipakai data lain' }
    }

    return { error: 'Gagal menghapus user secara permanen' }
  }

  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createProject(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'MARKETING'])
  const code = (formData.get('code') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const status = formData.get('status') as any
  const location = (formData.get('location') as string)?.trim()
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const budgetStr = formData.get('budget') as string

  if (!code || !name || !location) {
    return { error: 'Kode Proyek, Nama Proyek, dan Lokasi wajib diisi' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null
  const budget = parseCurrencyInput(budgetStr)

  if (!budget || budget < 1000000) {
    return { error: 'Budget proyek minimal Rp 1.000.000' }
  }

  try {
    await prisma.project.create({
      data: {
        tenantId: auth.tenantId,
        code,
        name,
        description: description || null,
        location,
        status: status || 'AKTIF',
        startDate,
        endDate,
        budget
      }
    })

    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    // Handle unique constraint violation (P2002)
    if (err?.code === 'P2002') {
      return { error: 'Kode Proyek sudah digunakan' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function updateProject(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'MARKETING'])
  const id = formData.get('id') as string
  const code = (formData.get('code') as string)?.trim()
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const status = formData.get('status') as any
  const location = (formData.get('location') as string)?.trim()
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const budgetStr = formData.get('budget') as string

  if (!id || !code || !name || !location) {
    return { error: 'ID, Kode Proyek, Nama Proyek, dan Lokasi wajib diisi' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null
  const budget = parseCurrencyInput(budgetStr)

  if (!budget || budget < 1000000) {
    return { error: 'Budget proyek minimal Rp 1.000.000' }
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, tenantId: auth.tenantId },
      select: { id: true },
    })

    if (!project) {
      return { error: 'Proyek tidak ditemukan atau bukan milik tenant ini' }
    }

    await prisma.project.update({
      where: { id },
      data: {
        code,
        name,
        description: description || null,
        location,
        status: status || 'AKTIF',
        startDate,
        endDate,
        budget,
      },
    })

    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Kode Proyek sudah digunakan oleh proyek lain' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteProject(projectId: string) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  if (!projectId) {
    return { error: 'ID proyek tidak valid' }
  }

  try {
    // TODO: Check linked transactions once Transaction model is migrated
    // const transactionCount = await prisma.transaction.count({ where: { projectId } })
    // if (transactionCount > 0) return { error: '...' }

    const project = await prisma.project.findFirst({
      where: getTenantWhere(auth.tenantId, { id: projectId }),
    })

    if (!project) {
      return { error: 'Proyek tidak ditemukan atau bukan milik tenant ini' }
    }

    await prisma.project.delete({
      where: { id: projectId },
    })

    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    // Handle foreign key constraint (if transactions exist)
    if (err?.code === 'P2003') {
      return { error: 'Tidak dapat menghapus proyek. Masih ada data terkait.' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

// ─── ACCOUNT (Daftar Akun / Chart of Accounts) ──────────────

export async function createAccount(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const normalBalance = formData.get('normalBalance') as string
  const description = formData.get('description') as string
  const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true'

  if (!code || !name || !type || !normalBalance) {
    return { error: 'Kode, Nama, Tipe, dan Saldo Normal wajib diisi' }
  }

  try {
    await prisma.account.create({
      data: {
        tenantId: auth.tenantId,
        code,
        name,
        type: type as any,
        normalBalance: normalBalance as any,
        description: description || null,
        isActive,
      }
    })

    revalidatePath('/dashboard/daftar-akun')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Kode akun sudah digunakan' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function updateAccount(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  const id = formData.get('id') as string
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const normalBalance = formData.get('normalBalance') as string
  const description = formData.get('description') as string
  const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true'

  if (!id || !code || !name || !type || !normalBalance) {
    return { error: 'Data tidak lengkap' }
  }

  try {
    await prisma.account.update({
      where: { id, tenantId: auth.tenantId },
      data: {
        code,
        name,
        type: type as any,
        normalBalance: normalBalance as any,
        description: description || null,
        isActive,
      }
    })

    revalidatePath('/dashboard/daftar-akun')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Kode akun sudah digunakan oleh akun lain' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteAccount(accountId: string) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  if (!accountId) {
    return { error: 'ID akun tidak valid' }
  }

  try {
    await prisma.account.delete({
      where: { id: accountId, tenantId: auth.tenantId },
    })

    revalidatePath('/dashboard/daftar-akun')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2003') {
      return { error: 'Tidak dapat menghapus akun. Masih ada jurnal terkait.' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

// ─── TRANSACTION (Transaksi) ────────────────────────────────

async function resolveTransactionRelations(
  db: DbClient,
  tenantId: string,
  params: {
    category: string
    projectId?: string | null
    unitId?: string | null
    customerId?: string | null
    fallbackUnitId?: string | null
    fallbackCustomerId?: string | null
    fallbackProjectId?: string | null
  }
) {
  const selectedUnitId = params.unitId || params.fallbackUnitId || null
  const selectedCustomerId = params.customerId || params.fallbackCustomerId || null
  const selectedProjectId = params.projectId || params.fallbackProjectId || null

  let resolvedProjectId = selectedProjectId
  let resolvedUnitId = selectedUnitId
  let resolvedCustomerId = selectedCustomerId

  if (resolvedUnitId) {
    const unit = await db.unit.findFirst({
      where: { id: resolvedUnitId, tenantId },
      select: { id: true, projectId: true, customerId: true },
    })

    if (!unit) {
      throw new Error('Unit tidak ditemukan atau bukan milik tenant ini')
    }

    resolvedProjectId = unit.projectId
    resolvedCustomerId = resolvedCustomerId || unit.customerId
  }

  if (resolvedProjectId) {
    const project = await db.project.findFirst({
      where: { id: resolvedProjectId, tenantId },
      select: { id: true },
    })

    if (!project) {
      throw new Error('Proyek tidak ditemukan atau bukan milik tenant ini')
    }
  }

  if (resolvedCustomerId) {
    const customer = await db.customer.findFirst({
      where: { id: resolvedCustomerId, tenantId },
      select: { id: true },
    })

    if (!customer) {
      throw new Error('Pelanggan tidak ditemukan atau bukan milik tenant ini')
    }
  }

  if (EXPENSE_PROJECT_CATEGORIES.includes(params.category as (typeof EXPENSE_PROJECT_CATEGORIES)[number]) && !resolvedProjectId) {
    throw new Error('Proyek wajib diisi untuk transaksi biaya')
  }

  if (UNIT_REQUIRED_CATEGORIES.includes(params.category as (typeof UNIT_REQUIRED_CATEGORIES)[number]) && !resolvedUnitId) {
    throw new Error('Unit wajib diisi untuk transaksi penerimaan')
  }

  if (UNIT_REQUIRED_CATEGORIES.includes(params.category as (typeof UNIT_REQUIRED_CATEGORIES)[number]) && !resolvedCustomerId) {
    throw new Error('Pelanggan wajib diisi untuk transaksi penerimaan')
  }

  return {
    projectId: resolvedProjectId,
    unitId: resolvedUnitId,
    customerId: resolvedCustomerId,
  }
}

export async function updateTransaction(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN', 'MARKETING'])
  const id = formData.get('id') as string
  const reference = formData.get('reference') as string
  const dateStr = formData.get('date') as string
  const description = formData.get('description') as string
  const note = formData.get('note') as string
  const category = formData.get('category') as string
  const amountStr = formData.get('amount') as string
  const projectId = formData.get('projectId') as string
  const unitId = formData.get('unitId') as string
  const customerId = formData.get('customerId') as string
  const skema_pembayaran = (formData.get('skema_pembayaran') as string) || 'cash'
  const sumber_pembayaran = (formData.get('sumber_pembayaran') as string) || 'pembeli'
  const status_pengakuan = (formData.get('status_pengakuan') as string) || 'diterima'

  if (!id || !reference || !dateStr || !description || !category || !amountStr) {
    return { error: 'Semua data wajib diisi' }
  }

  const date = new Date(dateStr)
  const amount = parseCurrencyInput(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah harus berupa angka positif' }
  }

  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: { id, tenantId: auth.tenantId },
        select: { id: true, unitId: true, customerId: true, projectId: true },
      })

      if (!existingTransaction) {
        throw new Error('Transaksi tidak ditemukan atau bukan milik tenant ini')
      }

      const relations = await resolveTransactionRelations(tx, auth.tenantId, {
        category,
        projectId: projectId || null,
        unitId: unitId || null,
        customerId: customerId || null,
        fallbackProjectId: existingTransaction.projectId,
        fallbackUnitId: existingTransaction.unitId,
        fallbackCustomerId: existingTransaction.customerId,
      })

      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          reference,
          date,
          description,
          note: note || null,
          category: category as any,
          amount,
          projectId: relations.projectId || null,
          unitId: relations.unitId || null,
          customerId: relations.customerId || null,
          skema_pembayaran: skema_pembayaran as any,
          sumber_pembayaran: sumber_pembayaran as any,
          status_pengakuan: status_pengakuan as any,
        }
      })

      await tx.journalEntry.deleteMany({
        where: { transactionId: id, isAuto: true, tenantId: auth.tenantId }
      })

      await createAutoJournal(tx, updatedTransaction)

      const affectedUnitIds = new Set<string>()
      if (existingTransaction.unitId) affectedUnitIds.add(existingTransaction.unitId)
      if (relations.unitId) affectedUnitIds.add(relations.unitId)

      for (const affectedUnitId of affectedUnitIds) {
        await syncUnitStatusFromTransactions(tx, auth.tenantId, affectedUnitId)
      }

      return updatedTransaction
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/projek')
    revalidatePath('/dashboard/unit')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Nomor referensi sudah digunakan oleh transaksi lain' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function createTransaction(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN', 'MARKETING'])
  const reference = formData.get('reference') as string
  const dateStr = formData.get('date') as string
  const description = formData.get('description') as string
  const note = formData.get('note') as string
  const category = formData.get('category') as string
  const amountStr = formData.get('amount') as string
  const projectId = formData.get('projectId') as string
  const skema_pembayaran = (formData.get('skema_pembayaran') as string) || 'cash'
  const sumber_pembayaran = (formData.get('sumber_pembayaran') as string) || 'pembeli'
  const status_pengakuan = (formData.get('status_pengakuan') as string) || 'diterima'
  const unitId = formData.get('unitId') as string
  const customerId = formData.get('customerId') as string

  if (!reference || !dateStr || !description || !category || !amountStr) {
    return { error: 'Referensi, Tanggal, Keterangan, Kategori, dan Jumlah wajib diisi' }
  }

  const date = new Date(dateStr)
  const amount = parseCurrencyInput(amountStr)

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah harus berupa angka positif' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const relations = await resolveTransactionRelations(tx, auth.tenantId, {
        category,
        projectId: projectId || null,
        unitId: unitId || null,
        customerId: customerId || null,
      })

      const transaction = await tx.transaction.create({
        data: {
          tenantId: auth.tenantId,
          reference,
          date,
          description,
          note: note || null,
          category: category as any,
          amount,
          projectId: relations.projectId || null,
          skema_pembayaran: skema_pembayaran as any,
          sumber_pembayaran: sumber_pembayaran as any,
          status_pengakuan: status_pengakuan as any,
          unitId: relations.unitId || null,
          customerId: relations.customerId || null,
        }
      })

      if (relations.unitId) {
        await syncUnitStatusFromTransactions(tx, auth.tenantId, relations.unitId)
      }

      await createAutoJournal(tx, transaction)
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unit')
    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Nomor referensi sudah digunakan' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteTransaction(transactionId: string) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  if (!transactionId) {
    return { error: 'ID transaksi tidak valid' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existingTransaction = await tx.transaction.findFirst({
        where: { id: transactionId, tenantId: auth.tenantId },
        select: { id: true, unitId: true },
      })

      if (!existingTransaction) {
        throw new Error('Transaksi tidak ditemukan atau bukan milik tenant ini')
      }

      // Delete related journal entries first
      await tx.journalEntry.deleteMany({
        where: { transactionId, tenantId: auth.tenantId },
      })

      await tx.transaction.delete({
        where: { id: transactionId },
      })

      if (existingTransaction.unitId) {
        await syncUnitStatusFromTransactions(tx, auth.tenantId, existingTransaction.unitId)
      }
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unit')
    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteTransactions(transactionIds: string[]) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  if (!transactionIds || transactionIds.length === 0) {
    return { error: 'Tidak ada transaksi yang dipilih' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const affectedTransactions = await tx.transaction.findMany({
        where: { id: { in: transactionIds }, tenantId: auth.tenantId },
        select: { unitId: true },
      })

      const affectedUnitIds = Array.from(
        new Set(
          affectedTransactions
            .map((transaction) => transaction.unitId)
            .filter((unitId): unitId is string => Boolean(unitId)),
        ),
      )

      // Delete related journal entries first
      await tx.journalEntry.deleteMany({
        where: { transactionId: { in: transactionIds }, tenantId: auth.tenantId },
      })

      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds }, tenantId: auth.tenantId },
      })

      for (const affectedUnitId of affectedUnitIds) {
        await syncUnitStatusFromTransactions(tx, auth.tenantId, affectedUnitId)
      }
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unit')
    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

// ─── AUTO JOURNAL HELPER ────────────────────────────────────────

const ACCOUNTS_TEMPLATE = {
  bank:             { code: '1200', name: 'Bank',                              type: 'ASET',       normalBalance: 'DEBIT'  },
  pendapatanMuka:   { code: '2100', name: 'Pendapatan Diterima di Muka',       type: 'KEWAJIBAN',  normalBalance: 'KREDIT' },
  pendapatan:       { code: '4100', name: 'Pendapatan Penjualan Unit',         type: 'PENDAPATAN', normalBalance: 'KREDIT' },
  bebanKonstruksi:  { code: '5200', name: 'Beban Konstruksi',                  type: 'BEBAN',      normalBalance: 'DEBIT'  },
  bebanMarketing:   { code: '5300', name: 'Beban Marketing & Penjualan',       type: 'BEBAN',      normalBalance: 'DEBIT'  },
  bebanGaji:        { code: '5400', name: 'Beban Gaji & Upah',                 type: 'BEBAN',      normalBalance: 'DEBIT'  },
  bebanOperasional: { code: '5500', name: 'Beban Operasional Kantor',          type: 'BEBAN',      normalBalance: 'DEBIT'  },
};

async function ensureAccount(db: DbClient, tenantId: string, templateKey: keyof typeof ACCOUNTS_TEMPLATE) {
  const tpl = ACCOUNTS_TEMPLATE[templateKey];
  let acc = await db.account.findFirst({
    where: { 
      tenantId,
      OR: [{ code: tpl.code }, { name: { contains: tpl.name, mode: 'insensitive' } }] 
    }
  });
  if (!acc) {
    acc = await db.account.create({
      data: { 
        tenantId,
        code: tpl.code, 
        name: tpl.name, 
        type: tpl.type as any, 
        normalBalance: tpl.normalBalance as any, 
        isActive: true 
      }
    });
  }
  return acc;
}

async function createAutoJournal(db: DbClient, trans: any) {
  const tenantId = trans.tenantId;
  let entries: { accountId: string; debit: number; credit: number }[] = [];
  const bank = await ensureAccount(db, tenantId, 'bank');
  const amount = Number(trans.amount);
  const defaultDesc = `Auto Journal - ${trans.description}`;

  switch (trans.category) {
    case 'BOOKING_FEE':
    case 'DOWN_PAYMENT':
    case 'ANGSURAN_KPR': {
      const pMuka = await ensureAccount(db, tenantId, 'pendapatanMuka');
      entries.push({ accountId: bank.id, debit: amount, credit: 0 });
      entries.push({ accountId: pMuka.id, debit: 0, credit: amount });
      break;
    }
    case 'PENCAIRAN_KPR': {
      const pMuka = await ensureAccount(db, tenantId, 'pendapatanMuka');
      entries.push({ accountId: bank.id, debit: amount, credit: 0 });
      entries.push({ accountId: pMuka.id, debit: 0, credit: amount });
      break;
    }
    case 'PELUNASAN_CASH': {
      const pMuka = await ensureAccount(db, tenantId, 'pendapatanMuka');
      entries.push({ accountId: bank.id, debit: amount, credit: 0 });
      entries.push({ accountId: pMuka.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_KONSTRUKSI': {
      const bKons = await ensureAccount(db, tenantId, 'bebanKonstruksi');
      entries.push({ accountId: bKons.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_MARKETING': {
      const bMkt = await ensureAccount(db, tenantId, 'bebanMarketing');
      entries.push({ accountId: bMkt.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_GAJI': {
      const bGaji = await ensureAccount(db, tenantId, 'bebanGaji');
      entries.push({ accountId: bGaji.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_OPERASIONAL': {
      const bOps = await ensureAccount(db, tenantId, 'bebanOperasional');
      entries.push({ accountId: bOps.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'LAIN_LAIN': {
      const bOps = await ensureAccount(db, tenantId, 'bebanOperasional');
      entries.push({ accountId: bOps.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    default:
      break;
  }

  if (entries.length > 0) {
    await db.journalEntry.createMany({
      data: entries.map(e => ({
        tenantId,
        reference: trans.reference,
        date: trans.date,
        description: defaultDesc,
        transactionId: trans.id,
        accountId: e.accountId,
        debit: e.debit,
        credit: e.credit,
        isAuto: true
      }))
    });
  }
}

// ─── JOURNAL ENTRY (Jurnal Umum) ────────────────────────────

export async function createJournalEntries(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  const reference = formData.get('reference') as string
  const dateStr = formData.get('date') as string
  const description = formData.get('description') as string
  const transactionId = formData.get('transactionId') as string
  const entriesJson = formData.get('entries') as string

  if (!reference || !dateStr || !description || !entriesJson) {
    return { error: 'Referensi, Tanggal, Keterangan, dan Baris Jurnal wajib diisi' }
  }

  let entries: { accountId: string; debit: number; credit: number }[]
  try {
    entries = JSON.parse(entriesJson)
  } catch {
    return { error: 'Format baris jurnal tidak valid' }
  }

  if (entries.length < 2) {
    return { error: 'Minimal 2 baris jurnal diperlukan' }
  }

  const totalDebit = entries.reduce((s, e) => s + Number(e.debit || 0), 0)
  const totalCredit = entries.reduce((s, e) => s + Number(e.credit || 0), 0)

  if (totalDebit !== totalCredit || totalDebit === 0) {
    return { error: 'Total debit dan kredit harus seimbang dan lebih dari 0' }
  }

  const date = new Date(dateStr)

  try {
    await prisma.journalEntry.createMany({
      data: entries.map(entry => ({
        tenantId: auth.tenantId,
        reference,
        date,
        description,
        transactionId: transactionId || null,
        accountId: entry.accountId,
        debit: entry.debit || 0,
        credit: entry.credit || 0,
      }))
    })

    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteJournalEntriesByReference(reference: string) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  if (!reference) {
    return { error: 'Referensi tidak valid' }
  }

  try {
    await prisma.journalEntry.deleteMany({
      where: { reference, tenantId: auth.tenantId },
    })

    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

// ─── REVENUE RECOGNITION (Pengakuan Pendapatan) ─────────────────────────

export async function markProjectTerjual(projectId: string) {
  const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN'])
  if (!projectId) {
    return { error: 'ID proyek tidak valid' }
  }

  try {
    const proj = await prisma.project.findFirst({ 
      where: { id: projectId, tenantId: auth.tenantId } 
    })
    if (!proj) return { error: 'Proyek tidak ditemukan' }
    if (proj.status === 'TERJUAL') return { error: 'Proyek sudah diserahterimakan (TERJUAL)' }

    // Hitung total kas masuk untuk proyek ini
    const { _sum } = await prisma.transaction.aggregate({
      where: {
        tenantId: auth.tenantId,
        projectId,
        category: { in: ['BOOKING_FEE', 'DOWN_PAYMENT', 'PENCAIRAN_KPR', 'PELUNASAN_CASH'] }
      },
      _sum: { amount: true }
    });

    const totalMasuk = Number(_sum.amount || 0);

    // Update status_pengakuan transaksi terkait menjadi 'diakui'
    await prisma.transaction.updateMany({
      where: {
        tenantId: auth.tenantId,
        projectId,
        category: { in: ['BOOKING_FEE', 'DOWN_PAYMENT', 'PENCAIRAN_KPR', 'PELUNASAN_CASH'] }
      },
      data: { status_pengakuan: 'diakui' }
    });

    // Update status proyek
    await prisma.project.update({
      where: { id: projectId, tenantId: auth.tenantId },
      data: { 
        status: 'TERJUAL',
        handoverDate: new Date()
      }
    });

    if (totalMasuk > 0) {
      // Create journal entry for revenue recognition
      const pMuka = await ensureAccount(prisma, auth.tenantId, 'pendapatanMuka');
      const pPenjualan = await ensureAccount(prisma, auth.tenantId, 'pendapatan');
      
      const reference = `REV-${proj.code}-${Date.now().toString().slice(-4)}`;
      
      await prisma.journalEntry.createMany({
        data: [
          {
            tenantId: auth.tenantId,
            reference,
            date: new Date(),
            description: `Auto Journal - Pengakuan Pendapatan (Serah Terima) ${proj.code}`,
            accountId: pMuka.id,
            debit: totalMasuk,
            credit: 0,
            isAuto: true,
            transactionId: null
          },
          {
            tenantId: auth.tenantId,
            reference,
            date: new Date(),
            description: `Auto Journal - Pengakuan Pendapatan (Serah Terima) ${proj.code}`,
            accountId: pPenjualan.id,
            debit: 0,
            credit: totalMasuk,
            isAuto: true,
            transactionId: null
          }
        ]
      });
    }

    revalidatePath('/dashboard/projek');
    revalidatePath('/dashboard/transaksi');
    revalidatePath('/dashboard/jurnal-umum');
    revalidatePath('/dashboard/buku-besar');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message };
  }
}

// ─── SERAH TERIMA UNIT ACTION ───────────────────────────────────

export async function serahTerimaUnit(prevState: any, formData: FormData) {
  const unitId = formData.get('unitId') as string;
  const customerId = formData.get('customerId') as string;
  const handoverNo = formData.get('handoverNo') as string;
  const dateStr = formData.get('date') as string;

  if (!unitId || !customerId || !handoverNo || !dateStr) {
    return { error: 'Semua data serah terima harus diisi' };
  }

  const date = new Date(dateStr);

  try {
    const auth = await requireAuth(['SUPER_ADMIN', 'AKUNTAN']);

    // ── Guard: cek apakah unit sudah diserahterimakan ──
    const unitCheck = await prisma.unit.findFirst({ 
      where: { id: unitId, tenantId: auth.tenantId },
      include: { customer: true }
    });
    if (!unitCheck) return { error: 'Unit tidak ditemukan' };
    if (unitCheck.status === 'SERAH_TERIMA') {
      return { error: 'Unit ini sudah dalam status Serah Terima.' };
    }

    // ── Guard: cek apakah journal ST dengan handoverNo ini sudah ada ──
    const existingJournal = await prisma.journal.findFirst({
      where: { referenceNo: handoverNo, tenantId: auth.tenantId }
    });
    if (existingJournal) {
      return { error: `Jurnal dengan nomor ${handoverNo} sudah ada. Gunakan nomor Berita Acara yang berbeda.` };
    }

    // ── Pastikan akun ada sebelum masuk transaction ──
    const pMuka = await ensureAccount(prisma, auth.tenantId, 'pendapatanMuka');
    const pend = await ensureAccount(prisma, auth.tenantId, 'pendapatan');

    const result = await prisma.$transaction(async (tx) => {
      const penerimaan = await getUnitRevenueBreakdown(tx, auth.tenantId, unitId);
      if (penerimaan.total <= 0) {
        throw new Error('Belum ada penerimaan yang bisa diakui untuk unit ini');
      }

      // 1. Create Journal Header
      const journal = await tx.journal.create({
        data: {
          tenantId: auth.tenantId,
          referenceNo: handoverNo,
          description: `Pengakuan Pendapatan - ST Unit ${unitCheck.unitCode}`,
          date: date,
        }
      });

      // 2. Create SerahTerima record
      const st = await tx.serahTerima.create({
        data: {
          tenantId: auth.tenantId,
          handoverNo,
          date,
          unitId,
          customerId,
          notes: `Serah Terima Unit ${unitCheck.unitCode}`,
        }
      });

      // 3. Update Unit status
      await tx.unit.update({
        where: { id: unitId, tenantId: auth.tenantId },
        data: { status: 'SERAH_TERIMA' }
      });

      await tx.transaction.updateMany({
        where: {
          tenantId: auth.tenantId,
          unitId,
          category: { in: [...REVENUE_PROJECT_CATEGORIES] }
        },
        data: { status_pengakuan: 'diakui' }
      });

      // 4. Create Revenue Recognition Journal Entries (exactly 2 lines)
      const nilaiST = penerimaan.total;

      await tx.journalEntry.createMany({
        data: [
          {
            tenantId: auth.tenantId,
            journalId: journal.id,
            reference: handoverNo,
            date,
            description: `Pengakuan Pendapatan - ST Unit ${unitCheck.unitCode}`,
            accountId: pMuka.id,
            debit: nilaiST,
            credit: 0,
            isAuto: true,
            unitId: unitId,
            transactionId: null,
          },
          {
            tenantId: auth.tenantId,
            journalId: journal.id,
            reference: handoverNo,
            date,
            description: `Pengakuan Pendapatan - ST Unit ${unitCheck.unitCode}`,
            accountId: pend.id,
            debit: 0,
            credit: nilaiST,
            isAuto: true,
            unitId: unitId,
            transactionId: null,
          }
        ]
      });

      return {
        st,
        penerimaan
      };
    });

    revalidatePath('/dashboard/unit');
    revalidatePath('/dashboard/transaksi');
    revalidatePath('/dashboard/jurnal-umum');
    revalidatePath('/dashboard/buku-besar');
    revalidatePath('/dashboard/laporan');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Serah terima berhasil diproses. Pendapatan diakui sebesar ${formatRupiah(result.penerimaan.total)}.`,
      data: result.penerimaan
    };
  } catch (err: any) {
    return { error: 'Gagal melakukan serah terima: ' + err.message };
  }
}

// ─── STURCTURE CLEANUP (Kuitansi removed) ─────────────────────


// ─── CLEANUP ACTIONS ──────────────────────────────────────────

export async function cleanupDuplicateSTJournals() {
  const auth = await requireAuth(['SUPER_ADMIN']);
  
  try {
    const entries = await prisma.journalEntry.findMany({
      where: { 
        tenantId: auth.tenantId,
        reference: { startsWith: 'BA-ST/' }
      },
      orderBy: { createdAt: 'asc' }
    });

    const groups = new Map<string, any[]>();
    entries.forEach(e => {
      const list = groups.get(e.reference) || [];
      list.push(e);
      groups.set(e.reference, list);
    });

    let deleteCount = 0;
    let fixedCount = 0;
    
    for (const entryList of groups.values()) {
      const seenAccounts = new Set<string>();
      const toDelete: string[] = [];

      for (const entry of entryList) {
        if (seenAccounts.has(entry.accountId)) {
          toDelete.push(entry.id);
        } else {
          seenAccounts.add(entry.accountId);
        }
      }

      if (toDelete.length > 0) {
        await prisma.journalEntry.deleteMany({
          where: { id: { in: toDelete }, tenantId: auth.tenantId }
        });
        deleteCount += toDelete.length;
      }
    }

    const stRecords = await prisma.serahTerima.findMany({
      where: { tenantId: auth.tenantId },
      include: {
        unit: {
          select: { unitCode: true }
        }
      }
    });

    for (const stRecord of stRecords) {
      const penerimaan = await getUnitRevenueBreakdown(prisma, auth.tenantId, stRecord.unitId);
      const expectedAmount = penerimaan.total;

      if (expectedAmount <= 0) continue;

      const journal = await prisma.journal.findFirst({
        where: {
          tenantId: auth.tenantId,
          referenceNo: stRecord.handoverNo
        }
      });

      if (!journal) continue;

      const stEntries = await prisma.journalEntry.findMany({
        where: {
          tenantId: auth.tenantId,
          journalId: journal.id
        },
        orderBy: { createdAt: 'asc' }
      });

      if (stEntries.length < 2) continue;

      const debitEntry = stEntries.find((entry) => Number(entry.debit) > 0) ?? stEntries[0];
      const creditEntry = stEntries.find((entry) => entry.id !== debitEntry.id) ?? stEntries[1];

      const needsRepair =
        Number(debitEntry.debit) !== expectedAmount ||
        Number(debitEntry.credit) !== 0 ||
        Number(creditEntry.debit) !== 0 ||
        Number(creditEntry.credit) !== expectedAmount

      if (!needsRepair) continue;

      await prisma.$transaction([
        prisma.journalEntry.update({
          where: { id: debitEntry.id },
          data: {
            debit: expectedAmount,
            credit: 0,
            unitId: stRecord.unitId,
            description: `Pengakuan Pendapatan - ST Unit ${stRecord.unit.unitCode}`
          }
        }),
        prisma.journalEntry.update({
          where: { id: creditEntry.id },
          data: {
            debit: 0,
            credit: expectedAmount,
            unitId: stRecord.unitId,
            description: `Pengakuan Pendapatan - ST Unit ${stRecord.unit.unitCode}`
          }
        }),
        prisma.transaction.updateMany({
          where: {
            tenantId: auth.tenantId,
            unitId: stRecord.unitId,
            category: { in: [...REVENUE_PROJECT_CATEGORIES] }
          },
          data: { status_pengakuan: 'diakui' }
        })
      ]);

      fixedCount += 1;
    }

    revalidatePath('/dashboard/jurnal-umum');
    revalidatePath('/dashboard/laporan');
    revalidatePath('/dashboard/buku-besar');
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Cleanup selesai. ${deleteCount} baris jurnal dobel dihapus dan ${fixedCount} jurnal ST BA-ST diperbarui ke total penerimaan yang benar.`
    };
  } catch (err: any) {
    return { error: 'Gagal cleanup jurnal ST: ' + err.message };
  }
}
