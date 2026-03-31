'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getCompanyProfile() {
  const profile = await prisma.companyProfile.findFirst()
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
  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const logoUrl = formData.get('logoUrl') as string // In real app, handle file upload

  const existing = await prisma.companyProfile.findFirst()

  if (existing) {
    await prisma.companyProfile.update({
      where: { id: existing.id },
      data: { name, address, phone, email, logoUrl },
    })
  } else {
    await prisma.companyProfile.create({
      data: { name, address, phone, email, logoUrl },
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')
  
  return { message: 'Profile updated successfully' }
}

export async function register(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: 'User already exists' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  // Default role is USER, but you can change it logic here if needed
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      // role: 'USER', // Optional: Explicitly set role if needed, otherwise it uses default from schema
    },
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

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return { error: 'Invalid credentials' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    return { error: 'Invalid credentials' }
  }

  await createSession(String(user.id), remember)

  redirect('/dashboard')
}

export async function createProject(prevState: any, formData: FormData) {
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
  if (!projectId) {
    return { error: 'ID proyek tidak valid' }
  }

  try {
    // TODO: Check linked transactions once Transaction model is migrated
    // const transactionCount = await prisma.transaction.count({ where: { projectId } })
    // if (transactionCount > 0) return { error: '...' }

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

export async function createTransaction(prevState: any, formData: FormData) {
  const reference = formData.get('reference') as string
  const dateStr = formData.get('date') as string
  const description = formData.get('description') as string
  const note = formData.get('note') as string
  const category = formData.get('category') as string
  const amountStr = formData.get('amount') as string
  const projectId = formData.get('projectId') as string

  if (!reference || !dateStr || !description || !category || !amountStr) {
    return { error: 'Referensi, Tanggal, Keterangan, Kategori, dan Jumlah wajib diisi' }
  }

  const date = new Date(dateStr)
  const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''))

  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah harus berupa angka positif' }
  }

  try {
    await prisma.transaction.create({
      data: {
        reference,
        date,
        description,
        note: note || null,
        category: category as any,
        amount,
        projectId: projectId || null,
      }
    })

    revalidatePath('/dashboard/transaksi')
    revalidatePath('/dashboard')
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
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
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
