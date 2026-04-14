import { Router } from 'express';
import {
  getCollectionsHandler,
  addToCollectionHandler,
  removeFromCollectionHandler,
  getComicStatusHandler,
} from '../controllers/collection.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getCollectionsHandler);
router.post('/', authenticate, addToCollectionHandler);
router.delete('/', authenticate, removeFromCollectionHandler);
router.get('/comic/:comicId', authenticate, getComicStatusHandler);

export default router;
