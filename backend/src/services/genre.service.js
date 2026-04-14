import prisma from '../config/db.js';

export async function getAllGenres() {
  return prisma.genre.findMany({ orderBy: { name: 'asc' } });
}

export async function getAllTags() {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } });
}

export async function createTag(name) {
  return prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}
