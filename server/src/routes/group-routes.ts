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
import { stubAuthMiddleware } from '../middleware/stub-auth-middleware.js';

const router = Router();

router.use(stubAuthMiddleware);

router.get('/', getMyGroups);
router.post('/', createGroup);
router.get('/:id', isGroupMember, getGroupById);
router.put('/:id', isGroupAdmin, updateGroup);
router.delete('/:id', isGroupAdmin, deleteGroup);
router.post('/:id/leave', isGroupMember, leaveGroup);

export default router;
