import { Router } from 'express';

import { listGroups } from '../controllers/group-controller';

const router = Router();

// TODO: protect with authMiddleware once the Auth slice exists.
router.get('/', listGroups);

export default router;
