import { Router } from 'express';
import { registerHandler, loginHandler, getMeHandler } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
