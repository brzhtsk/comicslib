import { Router } from 'express';
import {
  getCommentsHandler, createCommentHandler,
  updateCommentHandler, deleteCommentHandler,
  toggleCommentLikeHandler,
} from '../controllers/comment.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

router.get('/',          optionalAuth, getCommentsHandler);
router.post('/',         authenticate, createCommentHandler);
router.put('/:id',       authenticate, updateCommentHandler);
router.delete('/:id',    authenticate, deleteCommentHandler);
router.post('/:id/like', authenticate, toggleCommentLikeHandler);

export default router;