import { Router } from 'express';
import {
  getChaptersByComicHandler,
  getChapterHandler,
  createChapterHandler,
  updateChapterHandler,
  deleteChapterHandler,
  downloadChapterHandler,
} from '../controllers/chapter.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadChapter } from '../middleware/upload.js';

const router = Router({ mergeParams: true });

router.get('/', getChaptersByComicHandler);
router.get('/:id', getChapterHandler);
router.get('/:id/download', downloadChapterHandler);

router.post('/', authenticate, requireRole('AUTHOR', 'TRANSLATOR'), uploadChapter, createChapterHandler);
router.put('/:id', authenticate, requireRole('AUTHOR', 'TRANSLATOR'), uploadChapter, updateChapterHandler);
router.delete('/:id', authenticate, requireRole('AUTHOR', 'TRANSLATOR'), deleteChapterHandler);

export default router;