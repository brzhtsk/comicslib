import path from 'path';
import fs from 'fs';
import prisma from '../config/db.js';
import { createError } from '../middleware/error.js';
import { buildFileUrl } from '../utils/file.utils.js';
import { extractChapterZip } from '../utils/zip.utils.js';

function formatChapter(chapter) {
  return {
    ...chapter,
    pages: chapter.pages?.map((p) => ({ ...p, url: buildFileUrl(p.url) })) ?? [],
  };
}

function canEditComic(comic, userId) {
  return comic.publisherId === userId || comic.translatorId === userId;
}

export async function getChaptersByComic(comicId) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });
  if (!comic) throw createError(404, 'Комікс не знайдено');

  const chapters = await prisma.chapter.findMany({
    where: { comicId },
    orderBy: { number: 'asc' },
    select: {
      id: true, title: true, number: true, createdAt: true,
      _count: { select: { pages: true, likes: true, comments: true } },
    },
  });

  return chapters.map((ch) => ({
    ...ch,
    pagesCount:    ch._count.pages,
    likesCount:    ch._count.likes,
    commentsCount: ch._count.comments,
  }));
}

export async function getChapterById(id) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { order: 'asc' } },
      comic: { select: { id: true, title: true, publisherId: true, translatorId: true } },
    },
  });

  if (!chapter) throw createError(404, 'Главу не знайдено');
  return formatChapter(chapter);
}

export async function createChapter(comicId, userId, { title, number }, zipFile) {
  const comic = await prisma.comic.findUnique({ where: { id: comicId } });

  if (!comic) throw createError(404, 'Комікс не знайдено');
  if (!canEditComic(comic, userId)) throw createError(403, 'Немає прав для додавання глави');

  const chapterNumber = parseFloat(number);
  if (isNaN(chapterNumber)) throw createError(400, 'Номер глави має бути числом');

  const exists = await prisma.chapter.findUnique({
    where: { comicId_number: { comicId, number: chapterNumber } },
  });
  if (exists) throw createError(409, `Глава ${chapterNumber} вже існує`);

  if (!zipFile) throw createError(400, 'Файл архіву обовʼязковий');

  const chapter = await prisma.chapter.create({
    data: { comicId, title: title || null, number: chapterNumber },
  });

  try {
    const outputDir = path.join('uploads', 'chapters', String(chapter.id));
    const pages = extractChapterZip(zipFile.path, outputDir);
    await prisma.chapterPage.createMany({
      data: pages.map((p) => ({ chapterId: chapter.id, url: p.url, order: p.order })),
    });
  } catch (err) {
    await prisma.chapter.delete({ where: { id: chapter.id } });
    throw createError(422, `Помилка обробки архіву: ${err.message}`);
  }

  return getChapterById(chapter.id);
}

export async function updateChapter(id, userId, { title }, zipFile) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { comic: true },
  });

  if (!chapter) throw createError(404, 'Главу не знайдено');
  if (!canEditComic(chapter.comic, userId)) throw createError(403, 'Немає прав для редагування');

  const data = {};
  if (title !== undefined) data.title = title;

  if (zipFile) {
    const oldPages = await prisma.chapterPage.findMany({ where: { chapterId: id } });
    await prisma.chapterPage.deleteMany({ where: { chapterId: id } });
    oldPages.forEach((p) => { try { fs.unlinkSync(p.url); } catch {} });

    const outputDir = path.join('uploads', 'chapters', String(id));
    const pages = extractChapterZip(zipFile.path, outputDir);
    await prisma.chapterPage.createMany({
      data: pages.map((p) => ({ chapterId: id, url: p.url, order: p.order })),
    });
  }

  await prisma.chapter.update({ where: { id }, data });
  return getChapterById(id);
}

export async function deleteChapter(id, userId) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: { comic: true, pages: true },
  });

  if (!chapter) throw createError(404, 'Главу не знайдено');
  if (!canEditComic(chapter.comic, userId)) throw createError(403, 'Немає прав для видалення');

  chapter.pages.forEach((p) => { try { fs.unlinkSync(p.url); } catch {} });
  const dirPath = path.join('uploads', 'chapters', String(id));
  try { fs.rmdirSync(dirPath); } catch {}

  await prisma.chapter.delete({ where: { id } });
}

export async function downloadChapter(id) {
  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { order: 'asc' } },
      comic: { select: { title: true } },
    },
  });

  if (!chapter) throw createError(404, 'Главу не знайдено');
  return chapter;
}