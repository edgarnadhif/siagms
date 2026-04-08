'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { getTenantWhere, requireAuth } from '@/lib/auth'

function slugifyTenantName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getCompanyProfile() {
  const auth = await requireAuth()
  const profile = await prisma.companyProfile.findUnique({
    where: { tenantId: auth.tenantId },
  })
  if (!profile) {
    return {
      name: "SIAGMS",
      logoUrl: "",
      address: "",
      phone: "",
      email: "",
    }
  }
  return profile
}

export async function updateCompanyProfile(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN'])
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const logoUrl = formData.get('logoUrl') as string // In real app, handle file upload

  const existing = await prisma.companyProfile.findUnique({
    where: { tenantId: auth.tenantId },
  })

  if (existing) {
    await prisma.companyProfile.update({
      where: { id: existing.id },
      data: { name, address, phone, email, logoUrl },
    })
  } else {
    await prisma.companyProfile.create({
      data: { tenantId: auth.tenantId, name, address, phone, email, logoUrl },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')
  
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

export async function createProject(prevState: any, formData: FormData) {
  const auth = await requireAuth(['SUPER_ADMIN', 'MARKETING'])
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as any
  const startDateStr = formData.get('startDate') as string
  const budgetStr = formData.get('budget') as string

  if (!code || !name) {
    return { error: 'Kode Proyek dan Nama Proyek wajib diisi' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const budget = budgetStr ? parseFloat(budgetStr.replace(/\D/g, '')) : 0

  try {
    await prisma.project.create({
      data: {
        tenantId: auth.tenantId,
        code,
        name,
        description,
        status: status || 'AKTIF',
        startDate,
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
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as any
  const location = formData.get('location') as string
  const startDateStr = formData.get('startDate') as string
  const budgetStr = formData.get('budget') as string

  if (!id || !code || !name) {
    return { error: 'ID, Kode Proyek, dan Nama Proyek wajib diisi' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const budget = budgetStr ? parseFloat(budgetStr.replace(/\D/g, '')) : 0

  try {
    const project = await prisma.project.findFirst({
      where: getTenantWhere(auth.tenantId, { id }),
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
        description,
        location,
        status: status || 'AKTIF',
        startDate,
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
      where: { id },
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
  if (!accountId) {
    return { error: 'ID akun tidak valid' }
  }

  try {
    await prisma.account.delete({
      where: { id: accountId },
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

export async function updateTransaction(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
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

  if (!id || !reference || !dateStr || !description || !category || !amountStr) {
    return { error: 'Semua data wajib diisi' }
  }

  const date = new Date(dateStr)
  const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''))

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah harus berupa angka positif' }
  }

  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        reference,
        date,
        description,
        note: note || null,
        category: category as any,
        amount,
        projectId: projectId || null,
        skema_pembayaran: skema_pembayaran as any,
        sumber_pembayaran: sumber_pembayaran as any,
        status_pengakuan: status_pengakuan as any,
      }
    })

    // Hapus jurnal otomatis lama dan buat yang baru
    await prisma.journalEntry.deleteMany({
      where: { transactionId: id, isAuto: true }
    });
    await createAutoJournal(transaction);

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Nomor referensi sudah digunakan oleh transaksi lain' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function createTransaction(prevState: any, formData: FormData) {
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
  const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''))

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah harus berupa angka positif' }
  }

  // Determine unit status update based on category
  const unitStatusMap: Record<string, string> = {
    BOOKING_FEE: 'BOOKING',
    DOWN_PAYMENT: 'INDENT',
    PENCAIRAN_KPR: 'LUNAS',
    PELUNASAN_CASH: 'LUNAS',
  };
  const newUnitStatus = category ? unitStatusMap[category] : null;

  try {
    const transaction = await prisma.transaction.create({
      data: {
        reference,
        date,
        description,
        note: note || null,
        category: category as any,
        amount,
        projectId: projectId || null,
        skema_pembayaran: skema_pembayaran as any,
        sumber_pembayaran: sumber_pembayaran as any,
        status_pengakuan: status_pengakuan as any,
        unitId: unitId || null,
        customerId: customerId || null,
      }
    });

    // Auto-update unit status
    if (unitId && newUnitStatus) {
      await prisma.unit.update({
        where: { id: unitId },
        data: { status: newUnitStatus as any }
      });
    }

    await createAutoJournal(transaction);

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/unit')
    return { success: true }
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return { error: 'Nomor referensi sudah digunakan' }
    }
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteTransaction(transactionId: string) {
  if (!transactionId) {
    return { error: 'ID transaksi tidak valid' }
  }

  try {
    // Delete related journal entries first
    await prisma.journalEntry.deleteMany({
      where: { transactionId },
    })

    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}

export async function deleteTransactions(transactionIds: string[]) {
  if (!transactionIds || transactionIds.length === 0) {
    return { error: 'Tidak ada transaksi yang dipilih' }
  }

  try {
    // Delete related journal entries first
    await prisma.journalEntry.deleteMany({
      where: { transactionId: { in: transactionIds } },
    })

    await prisma.transaction.deleteMany({
      where: { id: { in: transactionIds } },
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard/jurnal-umum')
    revalidatePath('/dashboard/buku-besar')
    revalidatePath('/dashboard')
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

async function ensureAccount(templateKey: keyof typeof ACCOUNTS_TEMPLATE) {
  const tpl = ACCOUNTS_TEMPLATE[templateKey];
  let acc = await prisma.account.findFirst({
    where: { OR: [{ code: tpl.code }, { name: { contains: tpl.name, mode: 'insensitive' } }] }
  });
  if (!acc) {
    acc = await prisma.account.create({
      data: { code: tpl.code, name: tpl.name, type: tpl.type as any, normalBalance: tpl.normalBalance as any, isActive: true }
    });
  }
  return acc;
}

async function createAutoJournal(trans: any) {
  let entries: { accountId: string; debit: number; credit: number }[] = [];
  const bank = await ensureAccount('bank');
  const amount = Number(trans.amount);
  const defaultDesc = `Auto Journal - ${trans.description}`;

  switch (trans.category) {
    case 'BOOKING_FEE':
    case 'DOWN_PAYMENT':
    case 'ANGSURAN_KPR': {
      const pMuka = await ensureAccount('pendapatanMuka');
      entries.push({ accountId: bank.id, debit: amount, credit: 0 });
      entries.push({ accountId: pMuka.id, debit: 0, credit: amount });
      break;
    }
    case 'PENCAIRAN_KPR':
    case 'PELUNASAN_CASH': {
      const pend = await ensureAccount('pendapatan');
      entries.push({ accountId: bank.id, debit: amount, credit: 0 });
      entries.push({ accountId: pend.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_KONSTRUKSI': {
      const bKons = await ensureAccount('bebanKonstruksi');
      entries.push({ accountId: bKons.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_MARKETING': {
      const bMkt = await ensureAccount('bebanMarketing');
      entries.push({ accountId: bMkt.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_GAJI': {
      const bGaji = await ensureAccount('bebanGaji');
      entries.push({ accountId: bGaji.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    case 'BIAYA_OPERASIONAL': {
      const bOps = await ensureAccount('bebanOperasional');
      entries.push({ accountId: bOps.id, debit: amount, credit: 0 });
      entries.push({ accountId: bank.id, debit: 0, credit: amount });
      break;
    }
    default:
      break;
  }

  if (entries.length > 0) {
    await prisma.journalEntry.createMany({
      data: entries.map(e => ({
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
  if (!reference) {
    return { error: 'Referensi tidak valid' }
  }

  try {
    await prisma.journalEntry.deleteMany({
      where: { reference },
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
  if (!projectId) {
    return { error: 'ID proyek tidak valid' }
  }

  try {
    const proj = await prisma.project.findUnique({ where: { id: projectId } })
    if (!proj) return { error: 'Proyek tidak ditemukan' }
    if (proj.status === 'TERJUAL') return { error: 'Proyek sudah diserahterimakan (TERJUAL)' }

    // Hitung total kas masuk untuk proyek ini
    const { _sum } = await prisma.transaction.aggregate({
      where: {
        projectId,
        category: { in: ['BOOKING_FEE', 'DOWN_PAYMENT', 'PELUNASAN'] }
      },
      _sum: { amount: true }
    });

    const totalMasuk = Number(_sum.amount || 0);

    // Update status_pengakuan transaksi terkait menjadi 'diakui'
    await prisma.transaction.updateMany({
      where: {
        projectId,
        category: { in: ['BOOKING_FEE', 'DOWN_PAYMENT', 'PELUNASAN'] }
      },
      data: { status_pengakuan: 'diakui' }
    });

    // Update status proyek
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'TERJUAL',
        handoverDate: new Date()
      }
    });

    if (totalMasuk > 0) {
      // Create journal entry for revenue recognition
      const pMuka = await ensureAccount('pendapatanMuka');
      const pPenjualan = await ensureAccount('pendapatan');
      
      const reference = `REV-${proj.code}-${Date.now().toString().slice(-4)}`;
      
      await prisma.journalEntry.createMany({
        data: [
          {
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
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Unit details
      const unit = await tx.unit.findUnique({
        where: { id: unitId },
        include: { project: true }
      });

      if (!unit) throw new Error('Unit tidak ditemukan');

      // 2. Create SerahTerima record
      const st = await tx.serahTerima.create({
        data: {
          handoverNo,
          date,
          unitId,
          customerId,
          notes: `Serah Terima Unit ${unit.unitCode}`,
        }
      });

      // 3. Update Unit status
      await tx.unit.update({
        where: { id: unitId },
        data: { status: 'SERAH_TERIMA' }
      });

      // 4. Create Revenue Recognition Journal
      // pMuka: 2100 Pendapatan Diterima di Muka
      // pend: 4100 Pendapatan Penjualan Unit
      const pMuka = await ensureAccount('pendapatanMuka');
      const pend = await ensureAccount('pendapatan');
      const amount = Number(unit.price);

      await tx.journalEntry.createMany({
        data: [
          {
            reference: handoverNo,
            date,
            description: `Pengakuan Pendapatan - ST Unit ${unit.unitCode}`,
            accountId: pMuka.id,
            debit: amount,
            credit: 0,
            isAuto: true,
            unitId: unitId,
          },
          {
            reference: handoverNo,
            date,
            description: `Pengakuan Pendapatan - ST Unit ${unit.unitCode}`,
            accountId: pend.id,
            debit: 0,
            credit: amount,
            isAuto: true,
            unitId: unitId,
          }
        ]
      });

      return st;
    });

    revalidatePath('/dashboard/unit');
    revalidatePath('/dashboard/transaksi');
    revalidatePath('/dashboard/jurnal-umum');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: 'Gagal melakukan serah terima: ' + err.message };
  }
}
