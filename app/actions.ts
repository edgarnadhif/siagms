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
