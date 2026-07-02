import { Router } from 'express';

import {
  getAuthConfig,
  getMe,
  googleAuth,
  login,
  register,
  updateProfile,
} from '../controllers/auth-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { mergeAvatarIntoBody, uploadAvatar } from '../middleware/upload-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import {
  googleAuthBodySchema,
  loginBodySchema,
  registerBodySchema,
  updateProfileBodySchema,
} from '../models/user-model.js';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/register', validateBody(registerBodySchema), register);
router.post('/login', validateBody(loginBodySchema), login);
router.post('/google', validateBody(googleAuthBodySchema), googleAuth);
router.get('/me', authMiddleware, getMe);
router.put(
  '/me',
  authMiddleware,
  uploadAvatar,
  mergeAvatarIntoBody,
  validateBody(updateProfileBodySchema),
  updateProfile,
);

export default router;
