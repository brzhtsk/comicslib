import * as comicService from '../services/comic.service.js';

function parseIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number);
  try { return JSON.parse(raw); } catch { return []; }
}

export async function getComicsHandler(req, res, next) {
  try {
    const { page, size, sortBy, order, genre, status, search } = req.query;
    res.json(await comicService.getComics({ page, size, sortBy, order, genre, status, search }));
  } catch (err) { next(err); }
}

export async function getComicHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    res.json(await comicService.getComicById(id, req.user?.id ?? null));
  } catch (err) { next(err); }
}

export async function createComicHandler(req, res, next) {
  try {
    const { title, description, status, genreIds, tagIds, authorName, isTranslation } = req.body;
    const parsed = {
      title, description, status, authorName, isTranslation,
      genreIds: parseIds(genreIds),
      tagIds:   parseIds(tagIds),
    };
    const comic = await comicService.createComic(parsed, req.user.id, req.file, req.user.username);
    res.status(201).json(comic);
  } catch (err) { next(err); }
}

export async function updateComicHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    const { title, description, status, genreIds, tagIds, authorName, isTranslation } = req.body;
    const parsed = {
      title, description, status, authorName, isTranslation,
      genreIds: genreIds !== undefined ? parseIds(genreIds) : undefined,
      tagIds:   tagIds   !== undefined ? parseIds(tagIds)   : undefined,
    };
    res.json(await comicService.updateComic(id, req.user.id, parsed, req.file));
  } catch (err) { next(err); }
}

export async function deleteComicHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    await comicService.deleteComic(id, req.user.id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function getMyComicsHandler(req, res, next) {
  try {
    res.json(await comicService.getMyComics(req.user.id));
  } catch (err) { next(err); }
}

export async function getComicStatsHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    res.json(await comicService.getComicStats(id, req.user.id));
  } catch (err) { next(err); }
}