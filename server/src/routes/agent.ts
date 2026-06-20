import { Router } from 'express';

import { handleAgentChat } from '../controllers/agent-controller';

const router = Router();

// TODO: protect with authMiddleware once the Auth slice exists.
router.post('/chat', handleAgentChat);

export default router;
