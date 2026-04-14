import { Router } from 'express';
import { getGenresHandler, getTagsHandler, createTagHandler } from '../controllers/genre.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getGenresHandler);
router.get('/tags', getTagsHandler);
router.post('/tags', authenticate, requireRole('AUTHOR'), createTagHandler);

export default router;
