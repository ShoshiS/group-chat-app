import { Router } from 'express';

import { handleAgentChat } from '../controllers/agent-controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.post('/chat', authMiddleware, handleAgentChat);

export default router;
