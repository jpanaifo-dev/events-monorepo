import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

async function upsertUser(email: string, password: string, role: 'SUPER_ADMIN' | 'ADMIN' | 'USER', firstName: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  const existing = await prisma.authUser.findUnique({ where: { email } })
  const id = existing?.id ?? randomUUID()
  const user = await prisma.authUser.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { id, email, passwordHash, role },
  })
  await prisma.profile.upsert({ where: { id: user.id }, update: { firstName }, create: { id: user.id, firstName } })
  return user.email
}

async function main() {
  const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@events.local'
  const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD ?? 'ChangeMe123!'
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@events.local'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'
  await upsertUser(superAdminEmail, superAdminPassword, 'SUPER_ADMIN', 'Super Admin')
  await upsertUser(adminEmail, adminPassword, 'ADMIN', 'Administrador')
  console.log(`Usuarios iniciales listos: ${superAdminEmail}, ${adminEmail}`)
}

main().finally(() => prisma.$disconnect())
