import { Router } from 'express';

import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getMyGroups,
  inviteToGroup,
  leaveGroup,
  markGroupAsRead,
  removeMember,
  updateGroup,
} from '../controllers/group-controller.js';
import { isGroupAdmin, isGroupMember } from '../middleware/group-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import { mergeAvatarIntoBody, uploadGroupAvatar } from '../middleware/upload-middleware.js';
import validateGroup from '../models/group-model.js';
import Joi from 'joi';

const inviteBodySchema = Joi.object({
  invitee: Joi.string().min(2).required(),
}).options({ stripUnknown: true });

const markReadBodySchema = Joi.object({
  messageId: Joi.string().optional(),
}).options({ stripUnknown: true });

const router = Router();

router.use(authMiddleware);

router.get('/', getMyGroups);
router.post('/', uploadGroupAvatar, mergeAvatarIntoBody, validateBody(validateGroup), createGroup);
router.get('/:id', isGroupMember, getGroupById);
router.get('/:id/members', isGroupMember, getGroupMembers);
router.put(
  '/:id',
  isGroupAdmin,
  uploadGroupAvatar,
  mergeAvatarIntoBody,
  validateBody(validateGroup),
  updateGroup,
);
router.delete('/:id', isGroupAdmin, deleteGroup);
router.post('/:id/leave', isGroupMember, leaveGroup);
router.put('/:id/read', isGroupMember, validateBody(markReadBodySchema), markGroupAsRead);
router.post('/:id/invite', isGroupMember, validateBody(inviteBodySchema), inviteToGroup);
router.delete('/:id/members/:userId', isGroupAdmin, removeMember);

export default router;
