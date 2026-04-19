import * as collectionService from '../services/collection.service.js';

const VALID_STATUSES = ['READING', 'COMPLETED', 'PLANNED', 'FAVOURITE'];

export async function getCollectionsHandler(req, res, next) {
  try {
    const collections = await collectionService.getUserCollections(req.user.id);
    res.json(collections);
  } catch (err) {
    next(err);
  }
}

export async function setCollectionHandler(req, res, next) {
  try {
    const { comicId, status } = req.body;
    if (!comicId) return res.status(400).json({ message: 'comicId обовʼязковий' });
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status має бути одним із: ${VALID_STATUSES.join(', ')}` });
    }
    const result = await collectionService.setComicCollection(
      req.user.id, parseInt(comicId), status ?? null,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeFromCollectionHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id' });
    await collectionService.removeFromCollection(req.user.id, comicId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getComicStatusHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id' });
    const status = await collectionService.getComicCollectionStatus(req.user.id, comicId);
    res.json({ comicId, status });
  } catch (err) {
    next(err);
  }
}