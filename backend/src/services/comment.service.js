import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.utils.js';

const userSelect = { select: { id: true, username: true, avatarUrl: true } };

function formatComment(c) {
  return {
    ...c,
    likesCount:    c._count?.reactions ?? 0,
    repliesCount:  c._count?.replies   ?? 0,
    replies: c.replies?.map(formatComment) ?? [],
  };
}

const commentInclude = {
  user: userSelect,
  _count: { select: { reactions: true, replies: true } },
};

export async function getComments({ comicId, chapterId, parentId, page, size }) {
  const { skip, take, page: p, size: s } = getPagination(page, size);

  const where = {
    comicId,
    chapterId:  chapterId ? parseInt(chapterId) : null,
    parentId:   parentId  ? parseInt(parentId)  : null,
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        ...commentInclude,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: commentInclude,
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { data: comments.map(formatComment), meta: buildPaginationMeta(total, p, s) };
}

export async function createComment(userId, comicId, text, chapterId, parentId) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw createError(404, 'Главу не знайдено');
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw createError(404, 'Батьківський коментар не знайдено');
  }

  const comment = await prisma.comment.create({
    data: {
      text,
      userId,
      comicId,
      chapterId:  chapterId ?? null,
      parentId:   parentId  ?? null,
    },
    include: {
      ...commentInclude,
      replies: { include: commentInclude },
    },
  });

  return formatComment(comment);
}

export async function updateComment(id, userId, text) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)               throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для редагування');

  const updated = await prisma.comment.update({
    where:   { id },
    data:    { text },
    include: {
      ...commentInclude,
      replies: { include: commentInclude },
    },
  });
  return formatComment(updated);
}

export async function deleteComment(id, userId) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)               throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для видалення');
  await prisma.comment.delete({ where: { id } });
}

export async function reactToComment(userId, commentId, type) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw createError(404, 'Коментар не знайдено');

  const existing = await prisma.commentReaction.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing) {
    if (existing.type === type) {
      // Повторний клік — знімаємо реакцію
      await prisma.commentReaction.delete({
        where: { userId_commentId: { userId, commentId } },
      });
      return { reaction: null };
    }
    // Змінюємо тип реакції
    await prisma.commentReaction.update({
      where: { userId_commentId: { userId, commentId } },
      data:  { type },
    });
    return { reaction: type };
  }

  await prisma.commentReaction.create({ data: { userId, commentId, type } });
  return { reaction: type };
}