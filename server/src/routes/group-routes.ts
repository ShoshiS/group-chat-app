import { Router } from 'express';

import {
  createGroup,
  deleteGroup,
  getGroupById,
  getMyGroups,
  leaveGroup,
  updateGroup,
} from '../controllers/group-controller.js';
import { isGroupAdmin, isGroupMember } from '../middleware/group-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import validateGroup from '../models/group-model.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyGroups);
router.post('/', validateBody(validateGroup), createGroup);
router.get('/:id', isGroupMember, getGroupById);
router.put('/:id', isGroupAdmin, validateBody(validateGroup), updateGroup);
router.delete('/:id', isGroupAdmin, deleteGroup);
router.post('/:id/leave', isGroupMember, leaveGroup);

export default router;
