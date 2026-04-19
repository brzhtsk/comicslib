import * as commentService from '../services/comment.service.js';

export async function getCommentsHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });
    const { chapterId, parentId, page, size } = req.query;
    const result = await commentService.getComments({ comicId, chapterId, parentId, page, size });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createCommentHandler(req, res, next) {
  try {
    const comicId = parseInt(req.params.comicId);
    if (isNaN(comicId)) return res.status(400).json({ message: 'Невірний id коміксу' });
    const { text, chapterId, parentId } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Текст коментаря обовʼязковий' });
    const comment = await commentService.createComment(
      req.user.id, comicId, text.trim(),
      chapterId ? parseInt(chapterId) : null,
      parentId  ? parseInt(parentId)  : null,
    );
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

export async function updateCommentHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Текст коментаря обовʼязковий' });
    const comment = await commentService.updateComment(id, req.user.id, text.trim());
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

export async function deleteCommentHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    await commentService.deleteComment(id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reactToCommentHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    const { type } = req.body;
    if (!['LIKE', 'DISLIKE'].includes(type)) {
      return res.status(400).json({ message: 'type має бути LIKE або DISLIKE' });
    }
    const result = await commentService.reactToComment(req.user.id, id, type);
    res.json(result);
  } catch (err) {
    next(err);
  }
}