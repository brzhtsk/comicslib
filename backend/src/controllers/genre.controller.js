import * as genreService from '../services/genre.service.js';

export async function getGenresHandler(_req, res, next) {
  try {
    const genres = await genreService.getAllGenres();
    res.json(genres);
  } catch (err) {
    next(err);
  }
}

export async function getTagsHandler(_req, res, next) {
  try {
    const tags = await genreService.getAllTags();
    res.json(tags);
  } catch (err) {
    next(err);
  }
}

export async function createTagHandler(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Назва тегу обовʼязкова' });
    const tag = await genreService.createTag(name);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
}
