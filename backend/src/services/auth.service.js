import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { generateToken } from '../utils/jwt.utils.js';
import { createError } from '../middleware/error.js';

const SALT_ROUNDS = 10;

export async function register({ username, email, password, role }) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    if (existing.email === email) throw createError(409, 'Email вже використовується');
    throw createError(409, 'Username вже використовується');
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { username, email, password: hashed, role: role ?? 'READER' },
    select: { id: true, username: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken({ id: user.id, role: user.role });

  return { user, token };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw createError(401, 'Невірний email або пароль');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw createError(401, 'Невірний email або пароль');

  const token = generateToken({ id: user.id, role: user.role });

  const { password: _, ...safeUser } = user;

  return { user: safeUser, token };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) throw createError(404, 'Користувача не знайдено');

  return user;
}
