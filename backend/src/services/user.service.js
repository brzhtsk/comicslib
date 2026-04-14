import bcrypt from 'bcrypt';
import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
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

  return {
    ...user,
    avatarUrl: user.avatarUrl ? buildFileUrl(user.avatarUrl) : null,
  };
}

export async function updateUser(id, { username, bio, password }, avatarFile) {
  const data = {};

  if (username !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id } },
    });
    if (taken) throw createError(409, 'Username вже використовується');
    data.username = username;
  }

  if (bio !== undefined) data.bio = bio;

  if (password !== undefined) {
    if (password.length < 6) throw createError(400, 'Пароль має бути не менше 6 символів');
    data.password = await bcrypt.hash(password, 10);
  }

  if (avatarFile) {
    data.avatarUrl = avatarFile.path.replace(/\\/g, '/');
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
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

  return {
    ...updated,
    avatarUrl: updated.avatarUrl ? buildFileUrl(updated.avatarUrl) : null,
  };
}
