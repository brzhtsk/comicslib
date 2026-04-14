import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';

export async function toggleLike(userId, comicId, chapterId) {
  const where = { userId, comicId, chapterId: chapterId ?? null };

  const existing = await prisma.like.findFirst({ where });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw createError(404, 'Главу не знайдено');
  }

  await prisma.like.create({
    data: { userId, comicId, chapterId: chapterId ?? null },
  });

  return { liked: true };
}

export async function getLikeStatus(userId, comicId, chapterId) {
  const like = await prisma.like.findFirst({
    where: { userId, comicId, chapterId: chapterId ?? null },
  });

  const count = await prisma.like.count({
    where: { comicId, chapterId: chapterId ?? null },
  });

  return { liked: !!like, count };
}