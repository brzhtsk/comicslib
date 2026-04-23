import * as collectionService from '../services/collection.service.js';

export async function getCollectionsHandler(req, res, next) {
  try {
    res.json(await collectionService.getUserCollections(req.user.id));
  } catch (err) { next(err); }
}

export async function createCollectionHandler(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Назва обовʼязкова' });
    res.status(201).json(await collectionService.createCustomCollection(req.user.id, name));
  } catch (err) { next(err); }
}

export async function deleteCollectionHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    await collectionService.deleteCustomCollection(req.user.id, id);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function setComicCollectionHandler(req, res, next) {
  try {
    const { comicId, collectionId } = req.body;
    if (!comicId) return res.status(400).json({ message: 'comicId обовʼязковий' });
    const result = await collectionService.setComicCollection(
      req.user.id,
      parseInt(comicId),
      collectionId !== null && collectionId !== undefined ? parseInt(collectionId) : null,
    );
    res.json(result);
  } catch (err) { next(err); }
}

export async function getComicCollectionHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id' });
    res.json(await collectionService.getComicCollection(req.user.id, comicId));
  } catch (err) { next(err); }
}