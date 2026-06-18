import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { Auth } from '../services/auth';

/** Redirects authenticated users away from login/register. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);

  await auth.ensureSession();

  if (!auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
