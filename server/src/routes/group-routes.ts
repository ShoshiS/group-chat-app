import { Router } from 'express';

import { createGroup, getGroupById, getMyGroups } from '../controllers/group-controller.js';
import { isGroupMember } from '../middleware/group-middleware.js';
import { stubAuthMiddleware } from '../middleware/stub-auth-middleware.js';

const router = Router();

router.use(stubAuthMiddleware);

router.get('/', getMyGroups);
router.post('/', createGroup);
router.get('/:id', isGroupMember, getGroupById);

export default router;
