import * as likeService from '../services/like.service.js';

export async function toggleLikeHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });

    const chapterId = req.body.chapterId ? parseInt(req.body.chapterId) : null;

    const result = await likeService.toggleLike(req.user.id, comicId, chapterId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLikeStatusHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });

    const chapterId = req.query.chapterId ? parseInt(req.query.chapterId) : null;

    const result = await likeService.getLikeStatus(req.user.id, comicId, chapterId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
