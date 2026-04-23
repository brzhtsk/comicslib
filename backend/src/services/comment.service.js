import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.utils.js';

const userSelect = { select: { id: true, username: true, avatarUrl: true } };

const commentInclude = {
  user:       userSelect,
  reactions:  { select: { userId: true, type: true } },
  _count:     { select: { replies: true } },
};

function buildRepliesInclude(depth = 3) {
  if (depth === 0) return commentInclude;
  return {
    ...commentInclude,
    replies: {
      orderBy: { createdAt: 'asc' },
      include: buildRepliesInclude(depth - 1),
    },
  };
}

function formatComment(c, depth = 0, currentUserId = null) {
  const likes = (c.reactions ?? []).filter((r) => r.type === 'LIKE').length;
  const userLiked = currentUserId
    ? (c.reactions ?? []).some((r) => r.userId === currentUserId && r.type === 'LIKE')
    : false;

  return {
    id:          c.id,
    text:        c.text,
    createdAt:   c.createdAt,
    updatedAt:   c.updatedAt,
    user:        c.user,
    comicId:     c.comicId,
    chapterId:   c.chapterId,
    parentId:    c.parentId,
    depth,
    likesCount:  likes,
    userLiked,
    repliesCount: c._count?.replies ?? 0,
    replies: (c.replies ?? []).map((r) => formatComment(r, depth + 1, currentUserId)),
  };
}

function countAll(comments) {
  return comments.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
}

export async function getComments({ comicId, chapterId, page, size, currentUserId = null }) {
  const { skip, take, page: p, size: s } = getPagination(page, size);

  const where = {
    comicId,
    chapterId: chapterId ? parseInt(chapterId) : null,
    parentId:  null,
  };

  const [comments, rootTotal] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: buildRepliesInclude(3),
    }),
    prisma.comment.count({ where }),
  ]);

  const formatted = comments.map((c) => formatComment(c, 0, currentUserId));

  return {
    data: formatted,
    meta: { ...buildPaginationMeta(rootTotal, p, s), totalWithReplies: countAll(formatted) },
  };
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
    data: { text, userId, comicId, chapterId: chapterId ?? null, parentId: parentId ?? null },
    include: buildRepliesInclude(0),
  });

  return formatComment(comment, 0, userId);
}

export async function updateComment(id, userId, text) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)               throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для редагування');

  const updated = await prisma.comment.update({
    where: { id }, data: { text },
    include: buildRepliesInclude(0),
  });
  return formatComment(updated, 0, userId);
}

export async function deleteComment(id, userId) {
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment)               throw createError(404, 'Коментар не знайдено');
  if (comment.userId !== userId) throw createError(403, 'Немає прав для видалення');
  await prisma.comment.delete({ where: { id } });
}

// Тільки лайки (LIKE). Повторний клік — знімає.
export async function toggleCommentLike(userId, commentId) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw createError(404, 'Коментар не знайдено');

  const existing = await prisma.commentReaction.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  if (existing) {
    await prisma.commentReaction.delete({ where: { userId_commentId: { userId, commentId } } });
    const count = await prisma.commentReaction.count({ where: { commentId, type: 'LIKE' } });
    return { liked: false, likesCount: count, commentId };
  }

  await prisma.commentReaction.create({ data: { userId, commentId, type: 'LIKE' } });
  const count = await prisma.commentReaction.count({ where: { commentId, type: 'LIKE' } });
  return { liked: true, likesCount: count, commentId };
}