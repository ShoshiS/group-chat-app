import { Router } from 'express';

import {
  acceptInvitationHandler,
  listInvitations,
  rejectInvitationHandler,
} from '../controllers/invitation-controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listInvitations);
router.put('/:id/accept', acceptInvitationHandler);
router.put('/:id/reject', rejectInvitationHandler);

export default router;
