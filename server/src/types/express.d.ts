import type { HydratedDocument } from 'mongoose';
import type { Types } from 'mongoose';

import type { IGroup } from '../models/group-model.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by authMiddleware after JWT verification. */
      userId?: Types.ObjectId;
      /** Populated by group middleware to avoid a second DB lookup in controllers. */
      group?: HydratedDocument<IGroup>;
    }
  }
}

export {};
