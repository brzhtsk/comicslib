import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.utils.js';

function formatUser(u) {
  return u ? { ...u, avatarUrl: u.avatarUrl ? buildFileUrl(u.avatarUrl) : null } : null;
}

function formatComic(comic) {
  return {
    ...comic,
    coverUrl:       comic.coverUrl ? buildFileUrl(comic.coverUrl) : null,
    genres:         comic.genres?.map((cg) => cg.genre) ?? [],
    tags:           comic.tags?.map((ct) => ct.tag) ?? [],
    // Лайки коміксу — тільки де chapterId = null (не глави)
    likesCount:     comic.comicLikesCount ?? comic._count?.likes ?? 0,
    viewsCount:     comic._count?.views        ?? 0,
    commentsCount:  comic._count?.comments     ?? 0,
    chaptersCount:  comic._count?.chapters     ?? 0,
    bookmarksCount: comic._count?.collections  ?? 0,
    publisher:      formatUser(comic.publisher),
    translator:     formatUser(comic.translator),
  };
}

const comicInclude = {
  publisher:  { select: { id: true, username: true, avatarUrl: true } },
  translator: { select: { id: true, username: true, avatarUrl: true } },
  genres:     { include: { genre: true } },
  tags:       { include: { tag: true } },
  _count:     { select: { views: true, comments: true, chapters: true, collections: true } },
  // Лайки рахуємо лише для коміксу (chapterId = null)
  likes: { where: { chapterId: null }, select: { id: true } },
};

function withLikesCount(comic) {
  const likesCount = Array.isArray(comic.likes) ? comic.likes.length : 0;
  const { likes, ...rest } = comic;
  return { ...rest, comicLikesCount: likesCount };
}

export async function getComics({ page, size, sortBy, order, genre, status, search }) {
  const { skip, take, page: p, size: s } = getPagination(page, size);
  const dir = order === 'asc' ? 'asc' : 'desc';

  let orderBy;
  if      (sortBy === 'likes')  orderBy = { likes:  { _count: dir } };
  else if (sortBy === 'views')  orderBy = { views:  { _count: dir } };
  else if (sortBy === 'title')  orderBy = { title:  dir };
  else                          orderBy = { createdAt: dir };

  const where = {};
  if (status) where.status = status;
  if (genre)  where.genres = { some: { genre: { name: genre } } };
  if (search) {
    where.OR = [
      { title:      { contains: search, mode: 'insensitive' } },
      { authorName: { contains: search, mode: 'insensitive' } },
      { publisher:  { username: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [comics, total] = await Promise.all([
    prisma.comic.findMany({ where, skip, take, orderBy, include: comicInclude }),
    prisma.comic.count({ where }),
  ]);

  return { data: comics.map(withLikesCount).map(formatComic), meta: buildPaginationMeta(total, p, s) };
}

export async function getComicById(id, userId) {
  const comic = await prisma.comic.findUnique({
    where: { id },
    include: {
      ...comicInclude,
      chapters: {
        orderBy: { number: 'asc' },
        select: { id: true, title: true, number: true, createdAt: true, _count: { select: { pages: true } } },
      },
    },
  });

  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (userId) {
    await prisma.comicView.upsert({
      where:  { userId_comicId: { userId, comicId: id } },
      update: {},
      create: { userId, comicId: id },
    });
  }

  return {
    ...formatComic(withLikesCount(comic)),
    chapters: comic.chapters.map((ch) => ({ ...ch, pagesCount: ch._count.pages })),
  };
}

export async function createComic({ title, description, status, genreIds, tagIds, authorName, isTranslation }, publisherId, coverFile, publisherUsername) {
  if (!title)     throw createError(400, 'Назва коміксу обовʼязкова');
  if (!coverFile) throw createError(400, 'Обкладинка коміксу обовʼязкова');

  const resolvedAuthorName = authorName?.trim() || publisherUsername;

  const data = {
    title, description,
    status:       status ?? 'ONGOING',
    publisherId,
    authorName:   resolvedAuthorName,
    coverUrl:     coverFile.path.replace(/\\/g, '/'),
    translatorId: (isTranslation === 'true' || isTranslation === true) ? publisherId : null,
  };

  if (genreIds?.length) data.genres = { create: genreIds.map((gId) => ({ genre: { connect: { id: Number(gId) } } })) };
  if (tagIds?.length)   data.tags   = { create: tagIds.map((tId) => ({ tag:   { connect: { id: Number(tId) } } })) };

  const comic = await prisma.comic.create({ data, include: comicInclude });
  return formatComic(withLikesCount(comic));
}

export async function updateComic(id, publisherId, { title, description, status, genreIds, tagIds, authorName, isTranslation }, coverFile) {
  const existing = await prisma.comic.findUnique({ where: { id } });
  if (!existing)                    throw createError(404, 'Комікс не знайдено');
  if (existing.publisherId !== publisherId) throw createError(403, 'Немає прав для редагування');

  const data = {};
  if (title       !== undefined) data.title       = title;
  if (description !== undefined) data.description = description;
  if (status      !== undefined) data.status      = status;
  if (authorName  !== undefined) data.authorName  = authorName?.trim() || existing.authorName;
  if (coverFile)  data.coverUrl    = coverFile.path.replace(/\\/g, '/');
  if (isTranslation !== undefined) {
    data.translatorId = (isTranslation === 'true' || isTranslation === true) ? publisherId : null;
  }

  if (genreIds !== undefined) {
    await prisma.comicGenre.deleteMany({ where: { comicId: id } });
    data.genres = { create: genreIds.map((gId) => ({ genre: { connect: { id: Number(gId) } } })) };
  }
  if (tagIds !== undefined) {
    await prisma.comicTag.deleteMany({ where: { comicId: id } });
    data.tags = { create: tagIds.map((tId) => ({ tag: { connect: { id: Number(tId) } } })) };
  }

  const comic = await prisma.comic.update({ where: { id }, data, include: comicInclude });
  return formatComic(withLikesCount(comic));
}

export async function deleteComic(id, publisherId) {
  const existing = await prisma.comic.findUnique({ where: { id } });
  if (!existing)                    throw createError(404, 'Комікс не знайдено');
  if (existing.publisherId !== publisherId) throw createError(403, 'Немає прав для видалення');
  await prisma.comic.delete({ where: { id } });
}

export async function getMyComics(publisherId) {
  const comics = await prisma.comic.findMany({
    where:   { publisherId },
    orderBy: { createdAt: 'desc' },
    include: comicInclude,
  });
  return comics.map(withLikesCount).map(formatComic);
}

export async function getComicStats(id, publisherId) {
  const comic = await prisma.comic.findUnique({ where: { id } });
  if (!comic)                    throw createError(404, 'Комікс не знайдено');
  if (comic.publisherId !== publisherId) throw createError(403, 'Немає прав для перегляду статистики');

  const [likesCount, viewsCount, commentsCount, bookmarksCount] = await Promise.all([
    prisma.like.count({ where: { comicId: id, chapterId: null } }),
    prisma.comicView.count({ where: { comicId: id } }),
    prisma.comment.count({ where: { comicId: id, chapterId: null } }),
    prisma.collectionItem.count({ where: { comicId: id } }),
  ]);

  return { comicId: id, likesCount, viewsCount, commentsCount, bookmarksCount };
}