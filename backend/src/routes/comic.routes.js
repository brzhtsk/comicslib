import { Router } from 'express';
import {
  getComicsHandler, getComicHandler, createComicHandler,
  updateComicHandler, deleteComicHandler, getMyComicsHandler, getComicStatsHandler,
} from '../controllers/comic.controller.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { uploadCover } from '../middleware/upload.js';

const router = Router();

router.get('/',         getComicsHandler);
router.get('/my',       authenticate, requireRole('AUTHOR', 'TRANSLATOR'), getMyComicsHandler);
router.get('/:id',      optionalAuth, getComicHandler);
router.get('/:id/stats',authenticate, requireRole('AUTHOR', 'TRANSLATOR'), getComicStatsHandler);

router.post('/',        authenticate, requireRole('AUTHOR', 'TRANSLATOR'), uploadCover, createComicHandler);
router.put('/:id',      authenticate, requireRole('AUTHOR', 'TRANSLATOR'), uploadCover, updateComicHandler);
router.delete('/:id',   authenticate, requireRole('AUTHOR', 'TRANSLATOR'), deleteComicHandler);

export default router;