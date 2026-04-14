import { Router } from 'express';
import { toggleLikeHandler, getLikeStatusHandler } from '../controllers/like.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', authenticate, getLikeStatusHandler);
router.post('/', authenticate, toggleLikeHandler);

export default router;
