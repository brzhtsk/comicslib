import { Router } from 'express';
import {
  getCollectionsHandler,
  setCollectionHandler,
  removeFromCollectionHandler,
  getComicStatusHandler,
} from '../controllers/collection.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/',                   authenticate, getCollectionsHandler);
router.post('/',                  authenticate, setCollectionHandler);
router.delete('/:comicId',        authenticate, removeFromCollectionHandler);
router.get('/comic/:comicId',     authenticate, getComicStatusHandler);

export default router;