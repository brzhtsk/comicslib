import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';

export async function getComments({ comicId, chapterId, page, size }) {
  const { getPagination, buildPaginationMeta } = await import('../utils/pagination.utils.js');
  const { skip, take, page: p, size: s } = getPagination(page, size);

  const where = { comicId };
  if (chapterId) {
    where.chapterId = parseInt(chapterId);
  } else {
    where.chapterId = null;
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { data: comments, meta: buildPaginationMeta(total, p, s) };
}

export async function createComment(userId, comicId, text, chapterId) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw createError(404, 'Главу не знайдено');
  }

  return prisma.comment.create({
    data: {
      text,
      userId,
      comicId,
      chapterId: chapterId ?? null,
    },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
}

export async function updateComment(id, userId, text) {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для редагування');

  return prisma.comment.update({
    where: { id },
    data: { text },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
}

export async function deleteComment(id, userId) {
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для видалення');

  await prisma.comment.delete({ where: { id } });
}
