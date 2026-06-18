import { Router } from 'express';

import { getMe, login, register, updateProfile } from '../controllers/auth-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import {
  loginBodySchema,
  registerBodySchema,
  updateProfileBodySchema,
} from '../models/user-model.js';

const router = Router();

router.post('/register', validateBody(registerBodySchema), register);
router.post('/login', validateBody(loginBodySchema), login);
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validateBody(updateProfileBodySchema), updateProfile);

export default router;
