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

  await createSession(user.id, remember)

  redirect('/dashboard')
}

export async function createProject(prevState: any, formData: FormData) {
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const status = formData.get('status') as any
  const startDateStr = formData.get('startDate') as string
  const endDateStr = formData.get('endDate') as string
  const budgetStr = formData.get('budget') as string

  if (!code || !name) {
    return { error: 'Kode Proyek dan Nama Proyek wajib diisi' }
  }

  const startDate = startDateStr ? new Date(startDateStr) : null
  const endDate = endDateStr ? new Date(endDateStr) : null
  const budget = budgetStr ? parseFloat(budgetStr.replace(/\D/g, '')) : 0

  try {
    const existing = await prisma.project.findUnique({ where: { code } })
    if (existing) {
       return { error: 'Kode Proyek sudah digunakan' }
    }
    
    await prisma.project.create({
      data: {
        code,
        name,
        description,
        status: status || 'AKTIF',
        startDate,
        endDate,
        budget
      }
    })

    revalidatePath('/dashboard/projek')
    return { success: true }
  } catch (err: any) {
    return { error: 'Terjadi kesalahan sistem: ' + err?.message }
  }
}
