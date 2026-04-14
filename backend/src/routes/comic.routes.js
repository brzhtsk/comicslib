import { Router } from 'express';
import {
  getComicsHandler,
  getComicHandler,
  createComicHandler,
  updateComicHandler,
  deleteComicHandler,
  getMyComicsHandler,
  getComicStatsHandler,
} from '../controllers/comic.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadCover } from '../middleware/upload.js';

const router = Router();

router.get('/', getComicsHandler);
router.get('/my', authenticate, requireRole('AUTHOR'), getMyComicsHandler);
router.get('/:id', authenticate, getComicHandler);
router.get('/:id/stats', authenticate, requireRole('AUTHOR'), getComicStatsHandler);

router.post('/', authenticate, requireRole('AUTHOR'), uploadCover, createComicHandler);
router.put('/:id', authenticate, requireRole('AUTHOR'), uploadCover, updateComicHandler);
router.delete('/:id', authenticate, requireRole('AUTHOR'), deleteComicHandler);

export default router;
