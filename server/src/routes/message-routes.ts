import { Router } from 'express';

import {
  createMessage,
  deleteMessage,
  getMessages,
  updateMessage,
} from '../controllers/message-controller.js';
import { isGroupMember } from '../middleware/group-middleware.js';
import { isMessageOwner, isMessageOwnerOrAdmin } from '../middleware/message-middleware.js';
import { createRateLimiter } from '../middleware/rate-limiter-middleware.js';
import { mergeFileAttachments, uploadMessageFiles } from '../middleware/upload-middleware.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import { validateBody } from '../middleware/validate-middleware.js';
import validateMessage from '../models/message-model.js';

const messageRateLimiter = createRateLimiter(30, 60_000);

/**
 * Nested under a group — mounted at `/api/groups/:id/messages`.
 * mergeParams exposes the parent `:id` (group id) to the member guard and controllers.
 */
export const groupMessageRouter = Router({ mergeParams: true });

groupMessageRouter.use(authMiddleware);

groupMessageRouter.get('/', isGroupMember, getMessages);
groupMessageRouter.post(
  '/',
  isGroupMember,
  messageRateLimiter,
  uploadMessageFiles,
  mergeFileAttachments,
  validateBody(validateMessage),
  createMessage,
);

/** Single-message operations — mounted at `/api/messages`. */
export const messageRouter = Router();

messageRouter.use(authMiddleware);

messageRouter.put('/:id', isMessageOwner, validateBody(validateMessage), updateMessage);
messageRouter.delete('/:id', isMessageOwnerOrAdmin, deleteMessage);
