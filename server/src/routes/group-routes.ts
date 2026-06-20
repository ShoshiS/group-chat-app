import { Router } from 'express';

import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getMyGroups,
  leaveGroup,
  removeMember,
  updateGroup,
} from '../controllers/group-controller.js';
import { inviteToGroup, listGroupInvitations } from '../controllers/invitation-controller.js';
import { isGroupAdmin, isGroupMember } from '../middleware/group-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import validateGroup from '../models/group-model.js';
import { inviteBodySchema } from '../models/invitation-model.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getMyGroups);
router.post('/', validateBody(validateGroup), createGroup);
router.get('/:id/members', isGroupMember, getGroupMembers);
router.get('/:id/invitations', isGroupMember, listGroupInvitations);
router.get('/:id', isGroupMember, getGroupById);
router.put('/:id', isGroupAdmin, validateBody(validateGroup), updateGroup);
router.delete('/:id/members/:userId', isGroupAdmin, removeMember);
router.delete('/:id', isGroupAdmin, deleteGroup);
router.post('/:id/leave', isGroupMember, leaveGroup);
router.post('/:id/invite', isGroupMember, validateBody(inviteBodySchema), inviteToGroup);

export default router;
