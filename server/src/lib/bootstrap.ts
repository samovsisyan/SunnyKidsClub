import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when the database has none (e.g. a fresh production DB). */
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if ((await prisma.adminUser.count()) > 0) return;
  await prisma.adminUser.create({
    data: { email, name: 'Ադմինիստրատոր', passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`Created initial admin ${email}`);
}
