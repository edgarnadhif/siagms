'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

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

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

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

  // In a real app, you would set a session cookie here.
  // For this simple example, we'll just redirect to a dashboard.
  redirect('/dashboard')
}
