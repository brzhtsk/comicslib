import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.utils.js';

function formatComic(comic) {
  return {
    ...comic,
    coverUrl: comic.coverUrl ? buildFileUrl(comic.coverUrl) : null,
    genres: comic.genres?.map((cg) => cg.genre) ?? [],
    tags: comic.tags?.map((ct) => ct.tag) ?? [],
    likesCount: comic._count?.likes ?? 0,
    viewsCount: comic._count?.views ?? 0,
    commentsCount: comic._count?.comments ?? 0,
    chaptersCount: comic._count?.chapters ?? 0,
  };
}

const comicInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  genres: { include: { genre: true } },
  tags: { include: { tag: true } },
  _count: { select: { likes: true, views: true, comments: true, chapters: true } },
};

export async function getComics({ page, size, sortBy, order, genre, status, search }) {
  const { skip, take, page: p, size: s } = getPagination(page, size);

  const SORT_FIELDS = {
    createdAt: 'createdAt',
    views: { views: { _count: 'desc' } },
    likes: { likes: { _count: 'desc' } },
    title: 'title',
  };

  const orderByField = SORT_FIELDS[sortBy] ?? 'createdAt';
  const orderBy =
    typeof orderByField === 'string'
      ? { [orderByField]: order === 'asc' ? 'asc' : 'desc' }
      : orderByField;

  const where = {};

  if (status) where.status = status;

  if (genre) {
    where.genres = { some: { genre: { name: genre } } };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { username: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [comics, total] = await Promise.all([
    prisma.comic.findMany({ where, skip, take, orderBy, include: comicInclude }),
    prisma.comic.count({ where }),
  ]);

  return {
    data: comics.map(formatComic),
    meta: buildPaginationMeta(total, p, s),
  };
}

export async function getComicById(id, userId) {
  const comic = await prisma.comic.findUnique({
    where: { id },
    include: {
      ...comicInclude,
      chapters: {
        orderBy: { number: 'asc' },
        select: { id: true, title: true, number: true, createdAt: true },
      },
    },
  });

  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (userId) {
    await prisma.comicView.upsert({
      where: { userId_comicId: { userId, comicId: id } },
      update: {},
      create: { userId, comicId: id },
    });
  }

  return formatComic(comic);
}

export async function createComic({ title, description, status, genreIds, tagIds }, authorId, coverFile) {
  if (!title) throw createError(400, 'Назва коміксу обовʼязкова');

  const data = {
    title,
    description,
    status: status ?? 'ONGOING',
    authorId,
    coverUrl: coverFile ? coverFile.path.replace(/\\/g, '/') : null,
  };

  if (genreIds?.length) {
    data.genres = {
      create: genreIds.map((genreId) => ({ genre: { connect: { id: Number(genreId) } } })),
    };
  }

  if (tagIds?.length) {
    data.tags = {
      create: tagIds.map((tagId) => ({ tag: { connect: { id: Number(tagId) } } })),
    };
  }

  const comic = await prisma.comic.create({ data, include: comicInclude });

  return formatComic(comic);
}

export async function updateComic(id, authorId, { title, description, status, genreIds, tagIds }, coverFile) {
  const existing = await prisma.comic.findUnique({ where: { id } });

  if (!existing) throw createError(404, 'Комікс не знайдено');
  if (existing.authorId !== authorId) throw createError(403, 'Немає прав для редагування');

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (status !== undefined) data.status = status;
  if (coverFile) data.coverUrl = coverFile.path.replace(/\\/g, '/');

  if (genreIds !== undefined) {
    await prisma.comicGenre.deleteMany({ where: { comicId: id } });
    data.genres = {
      create: genreIds.map((genreId) => ({ genre: { connect: { id: Number(genreId) } } })),
    };
  }

  if (tagIds !== undefined) {
    await prisma.comicTag.deleteMany({ where: { comicId: id } });
    data.tags = {
      create: tagIds.map((tagId) => ({ tag: { connect: { id: Number(tagId) } } })),
    };
  }

  const comic = await prisma.comic.update({ where: { id }, data, include: comicInclude });

  return formatComic(comic);
}

export async function deleteComic(id, authorId) {
  const existing = await prisma.comic.findUnique({ where: { id } });

  if (!existing) throw createError(404, 'Комікс не знайдено');
  if (existing.authorId !== authorId) throw createError(403, 'Немає прав для видалення');

  await prisma.comic.delete({ where: { id } });
}

export async function getMyComics(authorId) {
  const comics = await prisma.comic.findMany({
    where: { authorId },
    orderBy: { createdAt: 'desc' },
    include: comicInclude,
  });

  return comics.map(formatComic);
}

export async function getComicStats(id, authorId) {
  const comic = await prisma.comic.findUnique({ where: { id } });

  if (!comic) throw createError(404, 'Комікс не знайдено');
  if (comic.authorId !== authorId) throw createError(403, 'Немає прав для перегляду статистики');

  const [likesCount, viewsCount, commentsCount] = await Promise.all([
    prisma.like.count({ where: { comicId: id } }),
    prisma.comicView.count({ where: { comicId: id } }),
    prisma.comment.count({ where: { comicId: id } }),
  ]);

  return { comicId: id, likesCount, viewsCount, commentsCount };
}
