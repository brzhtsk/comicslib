import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';

const BASE_COLLECTIONS = [
  { type: 'READING',   name: 'Читаю' },
  { type: 'COMPLETED', name: 'Прочитано' },
  { type: 'PLANNED',   name: 'В планах' },
  { type: 'FAVOURITE', name: 'Улюблене' },
];

// Ініціалізує базові колекції для юзера якщо вони ще не існують
async function ensureBaseCollections(userId) {
  for (const col of BASE_COLLECTIONS) {
    await prisma.collection.upsert({
      where: { userId_type_name: { userId, type: col.type, name: col.name } },
      update: {},
      create: { userId, type: col.type, name: col.name },
    });
  }
}

function formatItem(item) {
  return {
    ...item,
    comic: {
      ...item.comic,
      coverUrl: item.comic.coverUrl ? buildFileUrl(item.comic.coverUrl) : null,
      genres: item.comic.genres?.map((cg) => cg.genre) ?? [],
    },
  };
}

export async function getUserCollections(userId) {
  await ensureBaseCollections(userId);

  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          comic: {
            select: {
              id: true, title: true, coverUrl: true, status: true,
              genres: { include: { genre: true } },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
      _count: { select: { items: true } },
    },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  });

  return collections.map((col) => ({
    ...col,
    itemsCount: col._count.items,
    items: col.items.map(formatItem),
  }));
}

export async function createCustomCollection(userId, name) {
  if (!name?.trim()) throw createError(400, 'Назва колекції обовʼязкова');

  const existing = await prisma.collection.findFirst({
    where: { userId, name: name.trim(), type: 'CUSTOM' },
  });
  if (existing) throw createError(409, 'Колекція з такою назвою вже існує');

  return prisma.collection.create({
    data: { userId, name: name.trim(), type: 'CUSTOM' },
  });
}

export async function deleteCustomCollection(userId, collectionId) {
  const col = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!col)              throw createError(404, 'Колекцію не знайдено');
  if (col.userId !== userId) throw createError(403, 'Немає прав');
  if (col.type !== 'CUSTOM') throw createError(400, 'Базові колекції не можна видалити');
  await prisma.collection.delete({ where: { id: collectionId } });
}

// Виключна логіка: один комікс — одна колекція у межах одного юзера
export async function setComicCollection(userId, comicId, collectionId) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  if (collectionId !== null) {
    const col = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!col || col.userId !== userId) throw createError(404, 'Колекцію не знайдено');
  }

  // Видаляємо з поточної колекції цього юзера (якщо є)
  await prisma.collectionItem.deleteMany({ where: { userId, comicId } });

  if (collectionId === null) return { comicId, collectionId: null };

  const item = await prisma.collectionItem.create({
    data: { collectionId, comicId, userId },
  });

  return { comicId, collectionId: item.collectionId };
}

export async function getComicCollection(userId, comicId) {
  await ensureBaseCollections(userId);

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
  });

  const currentItem = await prisma.collectionItem.findUnique({
    where: { userId_comicId: { userId, comicId } },
  });

  return {
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      isActive: currentItem?.collectionId === c.id,
    })),
    currentCollectionId: currentItem?.collectionId ?? null,
  };
}