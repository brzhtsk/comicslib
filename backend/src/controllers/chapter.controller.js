import path from 'path';
import AdmZip from 'adm-zip';
import * as chapterService from '../services/chapter.service.js';

export async function getChaptersByComicHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });

    const chapters = await chapterService.getChaptersByComic(comicId);
    res.json(chapters);
  } catch (err) {
    next(err);
  }
}

export async function getChapterHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });

    const chapter = await chapterService.getChapterById(id);
    res.json(chapter);
  } catch (err) {
    next(err);
  }
}

export async function createChapterHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });

    const { title, number } = req.body;
    if (!number) return res.status(400).json({ message: 'Номер глави обовʼязковий' });

    const chapter = await chapterService.createChapter(
      comicId,
      req.user.id,
      { title, number },
      req.file,
    );
    res.status(201).json(chapter);
  } catch (err) {
    next(err);
  }
}

export async function updateChapterHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });

    const { title } = req.body;
    const chapter = await chapterService.updateChapter(id, req.user.id, { title }, req.file);
    res.json(chapter);
  } catch (err) {
    next(err);
  }
}

export async function deleteChapterHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });

    await chapterService.deleteChapter(id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function downloadChapterHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });

    const chapter = await chapterService.downloadChapter(id);

    const zip = new AdmZip();

    chapter.pages.forEach((page) => {
      const absolutePath = path.resolve(process.cwd(), page.url);
      const ext = path.extname(page.url) || '.jpg';
      const fileName = `page-${String(page.order).padStart(3, '0')}${ext}`;
      zip.addLocalFile(absolutePath, '', fileName);
    });

    const buffer = zip.toBuffer();
    const zipName = `chapter-${chapter.number}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}