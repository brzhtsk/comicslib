import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';

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
    },
    orderBy: { status: 'asc' },
  });

  return collections.map((col) => ({
    ...col,
    items: col.items.map(formatItem),
  }));
}

// Переміщує комікс між колекціями (виключна логіка):
// якщо комікс вже є в іншій колекції цього юзера — видаляємо звідти і додаємо у нову
export async function setComicCollection(userId, comicId, status) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  // Видаляємо з усіх колекцій цього юзера
  const userCollections = await prisma.collection.findMany({
    where: { userId },
    select: { id: true },
  });
  const collectionIds = userCollections.map((c) => c.id);

  if (collectionIds.length > 0) {
    await prisma.collectionItem.deleteMany({
      where: { comicId, collectionId: { in: collectionIds } },
    });
  }

  // Якщо status = null — просто видаляємо (виходимо після видалення)
  if (!status) return { comicId, status: null };

  // Створюємо або знаходимо колекцію з потрібним статусом
  const collection = await prisma.collection.upsert({
    where:  { userId_status: { userId, status } },
    update: {},
    create: { userId, status },
  });

  await prisma.collectionItem.create({
    data: { collectionId: collection.id, comicId },
  });

  return { collectionId: collection.id, status, comicId };
}

export async function removeFromCollection(userId, comicId) {
  const userCollections = await prisma.collection.findMany({
    where: { userId },
    select: { id: true },
  });
  const collectionIds = userCollections.map((c) => c.id);

  await prisma.collectionItem.deleteMany({
    where: { comicId, collectionId: { in: collectionIds } },
  });
}

export async function getComicCollectionStatus(userId, comicId) {
  const item = await prisma.collectionItem.findFirst({
    where: { comicId, collection: { userId } },
    include: { collection: { select: { status: true } } },
  });
  return item ? item.collection.status : null;
}