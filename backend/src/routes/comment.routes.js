import { Router } from 'express';
import {
  getCommentsHandler,
  createCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
} from '../controllers/comment.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/', getCommentsHandler);
router.post('/', authenticate, createCommentHandler);
router.put('/:id', authenticate, updateCommentHandler);
router.delete('/:id', authenticate, deleteCommentHandler);

export default router;
