import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';

export async function getUserCollections(userId) {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          comic: {
            select: {
              id: true,
              title: true,
              coverUrl: true,
              status: true,
              genres: { include: { genre: true } },
            },
          },
        },
        orderBy: { addedAt: 'desc' },
      },
    },
    orderBy: { status: 'asc' },
  });

  return collections;
}

export async function addToCollection(userId, comicId, status) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  const collection = await prisma.collection.upsert({
    where: { userId_status: { userId, status } },
    update: {},
    create: { userId, status },
  });

  const existing = await prisma.collectionItem.findFirst({
    where: { collectionId: collection.id, comicId },
  });

  if (existing) throw createError(409, 'Комікс вже є в цій колекції');

  await prisma.collectionItem.create({
    data: { collectionId: collection.id, comicId },
  });

  return { collectionId: collection.id, status, comicId };
}

export async function removeFromCollection(userId, comicId, status) {
  const collection = await prisma.collection.findUnique({
    where: { userId_status: { userId, status } },
  });

  if (!collection) throw createError(404, 'Колекцію не знайдено');

  const item = await prisma.collectionItem.findFirst({
    where: { collectionId: collection.id, comicId },
  });

  if (!item) throw createError(404, 'Комікс не знайдено в колекції');

  await prisma.collectionItem.delete({ where: { id: item.id } });
}

export async function getComicCollectionStatus(userId, comicId) {
  const items = await prisma.collectionItem.findMany({
    where: {
      comicId,
      collection: { userId },
    },
    include: { collection: { select: { status: true } } },
  });

  return items.map((item) => item.collection.status);
}
