import { Router } from 'express';

import {
  createMessage,
  deleteMessage,
  getMessages,
  updateMessage,
} from '../controllers/message-controller.js';
import { isGroupMember } from '../middleware/group-middleware.js';
import { isMessageOwner, isMessageOwnerOrAdmin } from '../middleware/message-middleware.js';
import { stubAuthMiddleware } from '../middleware/stub-auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import validateMessage from '../models/message-model.js';

/**
 * Nested under a group — mounted at `/api/groups/:id/messages`.
 * mergeParams exposes the parent `:id` (group id) to the member guard and controllers.
 */
export const groupMessageRouter = Router({ mergeParams: true });

groupMessageRouter.use(stubAuthMiddleware);

groupMessageRouter.get('/', isGroupMember, getMessages);
groupMessageRouter.post('/', isGroupMember, validateBody(validateMessage), createMessage);

/** Single-message operations — mounted at `/api/messages`. */
export const messageRouter = Router();

messageRouter.use(stubAuthMiddleware);

messageRouter.put('/:id', isMessageOwner, validateBody(validateMessage), updateMessage);
messageRouter.delete('/:id', isMessageOwnerOrAdmin, deleteMessage);
