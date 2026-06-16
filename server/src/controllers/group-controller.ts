import { type Request, type Response } from 'express';

import { getAllGroupsForApi } from '../services/group-service';

/** Lists all groups — handy for verifying agent-created records in MongoDB. */
export async function listGroups(_req: Request, res: Response): Promise<void> {
  try {
    const groups = await getAllGroupsForApi();
    res.json({ groups });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes('not connected') ? 503 : 500;
    res.status(status).json({ error: message });
  }
}
