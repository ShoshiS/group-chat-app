import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { GroupStore } from '../../features/groups/group';
import { readLastGroupId } from '../utils/last-group';

/** Sends authenticated users straight into a group chat (or new-group form if none exist). */
export const chatEntryGuard: CanActivateFn = async () => {
  const groupStore = inject(GroupStore);
  const router = inject(Router);

  if (groupStore.groups().length === 0) {
    await groupStore.load();
  }

  const groups = groupStore.groups();
  if (groups.length === 0) {
    return router.createUrlTree(['/groups', 'new']);
  }

  const lastId = readLastGroupId();
  const targetId =
    lastId && groups.some((group) => group.id === lastId) ? lastId : groups[0].id;

  return router.createUrlTree(['/groups', targetId]);
};
