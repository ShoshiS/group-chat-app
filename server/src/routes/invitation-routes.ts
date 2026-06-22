import { Router } from 'express';

import {
  acceptInvitation,
  getMyInvitations,
  rejectInvitation,
} from '../controllers/invitation-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyInvitations);
router.put('/:id/accept', acceptInvitation);
router.put('/:id/reject', rejectInvitation);

export default router;
