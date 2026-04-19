import { Router } from 'express';
import {
  getProfileHandler,
  updateProfileHandler,
  getPublicProfileHandler,
  getActivityStatsHandler,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { uploadCover } from '../middleware/upload.js';

const router = Router();

router.get('/me',          authenticate, getProfileHandler);
router.put('/me',          authenticate, uploadCover, updateProfileHandler);
router.get('/me/stats',    authenticate, getActivityStatsHandler);
router.get('/:id',         getPublicProfileHandler);

export default router;