import { Router } from 'express';
import {
  getCollectionsHandler,
  createCollectionHandler,
  deleteCollectionHandler,
  setComicCollectionHandler,
  getComicCollectionHandler,
} from '../controllers/collection.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/',                  authenticate, getCollectionsHandler);
router.post('/',                 authenticate, createCollectionHandler);
router.delete('/:id',            authenticate, deleteCollectionHandler);
router.post('/set',              authenticate, setComicCollectionHandler);
router.get('/comic/:comicId',    authenticate, getComicCollectionHandler);

export default router;